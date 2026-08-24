import { TimesheetsActionDialog } from './timesheets-action-dialog'
import { TimesheetsDeleteDialog } from './timesheets-delete-dialog'
import { useTimesheets } from './timesheets-provider'

export function TimesheetsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTimesheets()
  return (
    <>
      <TimesheetsActionDialog
        key='timesheet-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <TimesheetsActionDialog
            key={`timesheet-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <TimesheetsDeleteDialog
            key={`timesheet-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
