// app/api/bookings/route.ts
import { getPayload } from "payload"
import config from "@payload-config"
import { NextResponse } from "next/server"
import { getMeUser } from "@/utilities/getMeUser"

export async function POST(request: Request) {
  try {
    const currentUser = await getMeUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await getPayload({ config })
    const bookingData = await request.json()
    
    // Calculate the number of days between fromDate and toDate
    const fromDate = new Date(bookingData.fromDate || new Date())
    const toDate = new Date(bookingData.toDate || new Date())
    toDate.setDate(toDate.getDate() + parseInt(bookingData.duration))
    
    // Create a title for the booking
    const title = `Booking for ${currentUser.user.name || currentUser.user.email} - ${fromDate.toLocaleDateString()}`
    
    // Create booking in Payload CMS using your actual schema fields
    const booking = await payload.create({
      collection: "bookings",
      data: {
        title: title,
        customer: currentUser.user.id,
        post: bookingData.postId, // You'll need to pass this from the client
        paymentStatus: "paid", // Set to paid since payment was successful
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        // If you want to add guests, you can do so here
        // guests: bookingData.guestIds || [],
        // The slug will be auto-generated from the title
      },
    })
    
    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}