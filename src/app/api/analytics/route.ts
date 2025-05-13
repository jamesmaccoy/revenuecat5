import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']

export async function GET() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_PATH environment variable is not set')
    }

    if (!process.env.GA4_PROPERTY_ID) {
      throw new Error('GA4_PROPERTY_ID environment variable is not set')
    }

    // Read the service account file
    const serviceAccountPath = join(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_PATH)
    let credentials
    try {
      const fileContent = readFileSync(serviceAccountPath, 'utf-8')
      credentials = JSON.parse(fileContent)
      console.log('Service Account Email:', credentials.client_email)
    } catch (e) {
      throw new Error(`Error reading service account file: ${e.message}`)
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    })
    const authClient = (await auth.getClient()) as any
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: authClient,
    })

    console.log('GA4 Property ID:', process.env.GA4_PROPERTY_ID)

    // Get data for the last 7 days
    const response = await analyticsData.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      requestBody: {
        dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'deviceCategory' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
        ],
        dateRanges: [
          {
            startDate: '7daysAgo',
            endDate: 'today',
          },
        ],
        orderBys: [
          {
            metric: {
              metricName: 'activeUsers',
            },
            desc: true,
          },
        ],
      },
    })

    // Log the full response for debugging
    console.log('Full Analytics Response:', JSON.stringify(response.data, null, 2))

    // Check if we have any rows in the response
    if (!response.data.rows || response.data.rows.length === 0) {
      console.log('No data rows returned from GA4')
      return NextResponse.json({
        message: 'No data available',
        propertyId: process.env.GA4_PROPERTY_ID,
        serviceAccount: credentials.client_email,
        dateRange: '7daysAgo to today',
        details:
          'This could mean: 1) No data has been collected yet, 2) The property ID is incorrect, or 3) The service account lacks proper permissions',
      })
    }

    console.log('Number of rows returned:', response.data.rows.length)
    console.log('First row data:', response.data.rows[0])

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Analytics Error Details:', error)
    return NextResponse.json(
      {
        error: 'Analytics error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
