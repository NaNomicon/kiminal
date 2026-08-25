import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTimesheets } from './timesheets-provider'

export function TimesheetsPrimaryButtons() {
  const { setOpen } = useTimesheets()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Timesheet</span> <Plus size={18} />
      </Button>
    </div>
  )
}
