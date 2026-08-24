import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjects } from './projects-provider'

export function ProjectsPrimaryButtons() {
  const { setOpen } = useProjects()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Project</span> <Plus size={18} />
      </Button>
    </div>
  )
}
