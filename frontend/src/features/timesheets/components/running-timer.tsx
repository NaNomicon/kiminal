import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import {
  activitiesApi,
  projectsApi,
  timesheetsApi,
  type Timesheet,
} from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SelectDropdown } from '@/components/select-dropdown'

function projectName(t: Timesheet): string | undefined {
  return typeof t.project === 'object' && t.project !== null
    ? t.project.name
    : undefined
}

function activityName(t: Timesheet): string | undefined {
  return typeof t.activity === 'object' && t.activity !== null
    ? t.activity.name
    : undefined
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function formatHumanDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function useTickingDuration(beginIso: string): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return Math.max(0, now - new Date(beginIso).getTime()) / 1000
}

function ActiveTimer({ timesheet }: { timesheet: Timesheet }) {
  const queryClient = useQueryClient()
  const ticking = useTickingDuration(timesheet.begin)

  const stop = useMutation({
    mutationFn: () => timesheetsApi.stop(timesheet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success('Timer stopped.')
    },
    onError: (error) => handleServerError(error),
  })

  return (
    <Card>
      <CardHeader className='py-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Timer size={16} className='text-green-500' />
          Running timer
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 py-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <p className='truncate font-medium'>
              {activityName(timesheet) ?? `Activity #${timesheet.activity}`}
            </p>
            <p className='truncate text-muted-foreground'>
              {projectName(timesheet) ?? `Project #${timesheet.project}`}
            </p>
            {timesheet.description && (
              <p className='truncate text-xs text-muted-foreground'>
                {timesheet.description}
              </p>
            )}
          </div>
          <span className='shrink-0 font-mono text-lg tabular-nums'>
            {formatClock(ticking)}
          </span>
        </div>
        <Button
          variant='destructive'
          className='w-full'
          onClick={() => stop.mutate()}
          disabled={stop.isPending}
        >
          {stop.isPending ? (
            <Loader size={16} className='animate-spin' />
          ) : (
            <Pause size={16} />
          )}
          <span>Stop timer</span>
        </Button>
      </CardContent>
    </Card>
  )
}

function StartForm() {
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<number | undefined>(undefined)
  const [activityId, setActivityId] = useState<number | undefined>(undefined)

  const { data: projects, isError: projectsError } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsApi.list({ size: 100 }),
  })
  const { data: activities, isError: activitiesError } = useQuery({
    queryKey: ['activities', 'options'],
    queryFn: () => activitiesApi.list({ size: 100 }),
  })

  const activitiesForProject = useMemo(
    () =>
      (activities?.data ?? []).filter(
        (a) => projectId === undefined || a.project === projectId
      ),
    [activities, projectId]
  )

  const create = useMutation({
    mutationFn: () =>
      timesheetsApi.create({ project: projectId, activity: activityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success('Timer started.')
      setProjectId(undefined)
      setActivityId(undefined)
    },
    onError: (error) => handleServerError(error),
  })

  if (projectsError || activitiesError) {
    return (
      <p className='text-sm text-muted-foreground'>
        Could not load projects/activities.
      </p>
    )
  }

  return (
    <Card>
      <CardHeader className='py-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Play size={16} />
          Start timer
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 py-3'>
        <SelectDropdown
          isControlled
          defaultValue={projectId !== undefined ? String(projectId) : undefined}
          onValueChange={(v) => {
            setProjectId(Number(v))
            setActivityId(undefined)
          }}
          placeholder='Select a project'
          items={projects?.data.map((p) => ({
            label: p.name,
            value: String(p.id),
          }))}
        />
        <SelectDropdown
          isControlled
          defaultValue={activityId !== undefined ? String(activityId) : undefined}
          onValueChange={(v) => setActivityId(Number(v))}
          placeholder='Select an activity'
          items={activitiesForProject.map((a) => ({
            label: a.name,
            value: String(a.id),
          }))}
          disabled={projectId === undefined}
        />
        <Button
          className='w-full'
          onClick={() => create.mutate()}
          disabled={create.isPending || projectId === undefined || activityId === undefined}
        >
          {create.isPending ? (
            <Loader size={16} className='animate-spin' />
          ) : (
            <Play size={16} />
          )}
          <span>Start</span>
        </Button>
      </CardContent>
    </Card>
  )
}

function RecentList() {
  const queryClient = useQueryClient()
  const { data: recent } = useQuery({
    queryKey: ['timesheets', 'recent'],
    queryFn: () => timesheetsApi.recent({ size: 5 }),
  })

  const restart = useMutation({
    mutationFn: (id: number) => timesheetsApi.restart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success('Timer restarted.')
    },
    onError: (error) => handleServerError(error),
  })

  const entries = recent?.data ?? []
  if (entries.length === 0) return null

  return (
    <Card>
      <CardHeader className='py-3'>
        <CardTitle className='text-sm'>Recent</CardTitle>
      </CardHeader>
      <CardContent className='space-y-1 py-3'>
        {entries.map((t) => (
          <div
            key={t.id}
            className='flex items-center justify-between gap-2 text-sm'
          >
            <div className='min-w-0'>
              <p className='truncate'>
                {activityName(t) ?? `Activity #${t.activity}`}
              </p>
              <p className='truncate text-xs text-muted-foreground'>
                {projectName(t) ?? `Project #${t.project}`} ·{' '}
                {formatHumanDuration(t.duration ?? 0)}
              </p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              title='Restart timer'
              onClick={() => restart.mutate(t.id)}
              disabled={restart.isPending}
            >
              <RotateCcw size={16} />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RunningTimer() {
  const { data: active, isLoading } = useQuery({
    queryKey: ['timesheets', 'active'],
    queryFn: () => timesheetsApi.active(),
    refetchInterval: 60000,
  })

  const running = active?.data[0]

  return (
    <div className='flex flex-col gap-3 px-2'>
      {isLoading ? (
        <div className='flex justify-center py-4'>
          <Loader size={18} className='animate-spin' />
        </div>
      ) : running ? (
        <ActiveTimer timesheet={running} />
      ) : (
        <StartForm />
      )}
      <RecentList />
    </div>
  )
}
