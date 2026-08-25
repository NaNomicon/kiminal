import { ActivitiesActionDialog } from './activities-action-dialog'
import { ActivitiesDeleteDialog } from './activities-delete-dialog'
import { useActivities } from './activities-provider'

export function ActivitiesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useActivities()
  return (
    <>
      <ActivitiesActionDialog
        key='activity-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <ActivitiesActionDialog
            key={`activity-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ActivitiesDeleteDialog
            key={`activity-delete-${currentRow.id}`}
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
