import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useActivities } from './activities-provider'

export function ActivitiesPrimaryButtons() {
  const { setOpen } = useActivities()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Activity</span> <Plus size={18} />
      </Button>
    </div>
  )
}
