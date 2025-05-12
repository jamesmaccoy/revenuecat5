import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CopyIcon } from 'lucide-react'
import React, { FC } from 'react'

type Props = {
  trigger: React.ReactNode
}

const InviteUrlDialog: FC<Props> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Guests</DialogTitle>
          <DialogDescription>
            Share this link with your guests to invite them to the booking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input className="flex-1" />
          <Button size="sm">
            <CopyIcon className="size-4 mr-2" />
            <span>Copy</span>
          </Button>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="mt-4">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InviteUrlDialog
