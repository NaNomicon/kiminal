'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { timesheetsApi } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Timesheet } from '../data/schema'

type TimesheetMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function TimesheetsMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: TimesheetMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows as {
    original: Timesheet
  }[]

  const mutation = useMutation({
    mutationFn: () =>
      Promise.all(selectedRows.map((row) => timesheetsApi.delete(row.original.id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success(`Deleted ${selectedRows.length} timesheet${selectedRows.length > 1 ? 's' : ''}.`)
      setValue('')
      table.resetRowSelection()
      onOpenChange(false)
    },
    onError: (error) => handleServerError(error),
  })

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`)
      return
    }
    mutation.mutate()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      isLoading={mutation.isPending}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'timesheets' : 'timesheet'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete the selected timesheets? <br />
            This action cannot be undone.
          </p>
          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Confirm by typing "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
              autoFocus
            />
          </Label>
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
