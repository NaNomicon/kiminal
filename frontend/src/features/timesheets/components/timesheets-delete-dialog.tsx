'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { timesheetsApi } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Timesheet } from '../data/schema'

type TimesheetDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Timesheet
}

export function TimesheetsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: TimesheetDeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => timesheetsApi.delete(currentRow.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success('Timesheet deleted.')
      onOpenChange(false)
    },
    onError: (error) => handleServerError(error),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={() => mutation.mutate()}
      isLoading={mutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Timesheet
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete timesheet{' '}
            <span className='font-bold'>#{currentRow.id}</span>?
            <br />
            This action cannot be undone.
          </p>
          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}
