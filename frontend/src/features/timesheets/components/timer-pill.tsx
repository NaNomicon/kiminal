import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ellipsis, Loader, Pause, Play, RotateCcw } from 'lucide-react'
import {
  activitiesApi,
  projectsApi,
  timesheetsApi,
  type Timesheet,
} from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SelectDropdown } from '@/components/select-dropdown'
import { cn } from '@/lib/utils'

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

function projectIdOf(t: Timesheet): number | undefined {
  return typeof t.project === 'object' && t.project !== null
    ? t.project.id
    : (t.project as number | undefined)
}

function activityIdOf(t: Timesheet): number | undefined {
  return typeof t.activity === 'object' && t.activity !== null
    ? t.activity.id
    : (t.activity as number | undefined)
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

function TickingClock({ begin }: { begin: string | undefined }) {
  const ticking = useTickingDuration(begin ?? new Date().toISOString())
  return <>{formatClock(begin ? ticking : 0)}</>
}

/** True when the keyboard event originated inside a text input/select/textarea. */
function isEditingTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

function useProjectsAndActivities() {
  const projects = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsApi.list({ size: 100 }),
  })
  const activities = useQuery({
    queryKey: ['activities', 'options'],
    queryFn: () => activitiesApi.list({ size: 100 }),
  })
  return { projects, activities }
}

function projectItems(
  projects: readonly { id: number; name: string }[] | undefined
): { label: string; value: string }[] | undefined {
  return projects?.map((p) => ({ label: p.name, value: String(p.id) }))
}

function StartEditor({ onStarted }: { onStarted: () => void }) {
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<number | undefined>(undefined)
  const [activityId, setActivityId] = useState<number | undefined>(undefined)
  const [description, setDescription] = useState('')
  const { projects, activities } = useProjectsAndActivities()
  const projectsData = projects.data?.data
  const activitiesData = activities.data?.data

  const activitiesForProject = useMemo(
    () =>
      (activitiesData ?? []).filter(
        (a) => projectId === undefined || a.project === projectId
      ),
    [activitiesData, projectId]
  )

  const create = useMutation({
    mutationFn: () =>
      timesheetsApi.create({
        project: projectId,
        activity: activityId,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success('Timer started.')
      setProjectId(undefined)
      setActivityId(undefined)
      setDescription('')
      onStarted()
    },
    onError: (error) => handleServerError(error),
  })

  return (
    <div className='space-y-3'>
      <div className='grid gap-2 sm:grid-cols-2'>
        <SelectDropdown
          isControlled
          defaultValue={projectId !== undefined ? String(projectId) : undefined}
          onValueChange={(v) => {
            setProjectId(Number(v))
            setActivityId(undefined)
          }}
          placeholder='Select a project'
          items={projectItems(projectsData)}
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
      </div>
      <Input
        placeholder='What are you working on?'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
        <span>Start timer</span>
      </Button>
    </div>
  )
}

function RunningEditor({ timesheet }: { timesheet: Timesheet }) {
  const queryClient = useQueryClient()
  const { projects, activities } = useProjectsAndActivities()
  const projectsData = projects.data?.data
  const activitiesData = activities.data?.data
  const [description, setDescription] = useState(timesheet.description ?? '')
  const [projectId, setProjectId] = useState<number | undefined>(projectIdOf(timesheet))
  const [activityId, setActivityId] = useState<number | undefined>(activityIdOf(timesheet))

  const activitiesForProject = useMemo(
    () =>
      (activitiesData ?? []).filter(
        (a) => projectId === undefined || a.project === projectId
      ),
    [activitiesData, projectId]
  )

  const update = useMutation({
    mutationFn: (patch: Partial<Timesheet>) =>
      timesheetsApi.update(timesheet.id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
    },
    onError: (error) => handleServerError(error),
  })

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
    <div className='space-y-3'>
      <div className='grid gap-2 sm:grid-cols-2'>
        <SelectDropdown
          isControlled
          defaultValue={projectId !== undefined ? String(projectId) : undefined}
          onValueChange={(v) => {
            const next = Number(v)
            setProjectId(next)
            setActivityId(undefined)
            update.mutate({ project: next })
          }}
          placeholder='Select a project'
          items={projectItems(projectsData)}
        />
        <SelectDropdown
          isControlled
          defaultValue={activityId !== undefined ? String(activityId) : undefined}
          onValueChange={(v) => {
            const next = Number(v)
            setActivityId(next)
            update.mutate({ activity: next })
          }}
          placeholder='Select an activity'
          items={activitiesForProject.map((a) => ({
            label: a.name,
            value: String(a.id),
          }))}
          disabled={projectId === undefined}
        />
      </div>
      <Input
        placeholder='What are you working on?'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => {
          const next = description.trim()
          if (next !== (timesheet.description ?? '')) {
            update.mutate({ description: next || undefined })
          }
        }}
      />
      <Button
        variant='destructive'
        className='w-full'
        onClick={() => stop.mutate()}
        disabled={stop.isPending || update.isPending}      >
        {stop.isPending ? (
          <Loader size={16} className='animate-spin' />
        ) : (
          <Pause size={16} />
        )}
        <span>Stop timer</span>
      </Button>
    </div>
  )
}

function RecentList({ onRestart }: { onRestart?: () => void }) {
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
      onRestart?.()
    },
    onError: (error) => handleServerError(error),
  })

  const entries = recent?.data ?? []
  if (entries.length === 0) return null

  return (
    <div className='space-y-1 border-t pt-3'>
      <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        Recent
      </p>
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
    </div>
  )
}

/**
 * Compact running-timer pill mounted in the shared top navigation bar.
 *
 * The pill stays glanceable: a round start/stop button plus a ticking clock
 * (with a soft glow and pulsing dot while running). With multiple concurrent
 * timers running, the pill shows the count and the popover lists an editor
 * per timer plus a "start another" form. Clicking the ellipsis opens the
 * popover with the editors and the recent list. Kimai requires both a project
 * and an activity to start a timer, so the play button opens the editor until
 * both are chosen.
 */
export function TimerPill() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: active, isLoading } = useQuery({
    queryKey: ['timesheets', 'active'],
    queryFn: () => timesheetsApi.active(),
    refetchInterval: 60000,
  })
  const running = useMemo(() => active?.data ?? [], [active])

  // Keyboard shortcuts: N start, S stop first, C continue last. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditingTarget(e)) return
      const k = e.key.toLowerCase()
      if (k === 'n') {
        e.preventDefault()
        if (running.length === 0) setOpen(true)
      } else if (k === 's') {
        e.preventDefault()
        const first = running[0]
        if (first) {
          timesheetsApi.stop(first.id).then(() => {
            queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
            queryClient.invalidateQueries({ queryKey: ['timesheets'] })
          })
        }
      } else if (k === 'c') {
        e.preventDefault()
        timesheetsApi.recent({ size: 1 }).then((p) => {
          const last = p.data[0]
          if (last) {
            timesheetsApi.restart(last.id).then(() => {
              queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
              queryClient.invalidateQueries({ queryKey: ['timesheets'] })
            })
          }
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, queryClient])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'flex h-10 max-w-full items-center gap-2 rounded-full border px-2 text-sm transition-colors',
          running.length > 0
            ? 'border-primary/50 bg-primary/5'
            : 'border-muted-foreground/30 text-muted-foreground'
        )}
      >
        <Button
          size='icon'
          variant={running.length > 0 ? 'destructive' : 'ghost'}
          className={cn(
            'h-8 w-8 shrink-0 rounded-full',
            running.length === 0 && 'border border-muted-foreground/30'
          )}
          aria-pressed={running.length > 0 ? 'true' : 'false'}
          aria-label={
            running.length > 0 ? 'Stop all running timers' : 'Start timer'
          }
          onClick={() => {
            if (running.length > 0) {
              // Stop the oldest running timer first; others stay active.
              const first = running[running.length - 1]
              timesheetsApi.stop(first.id).then(() => {
                queryClient.invalidateQueries({ queryKey: ['timesheets', 'active'] })
                queryClient.invalidateQueries({ queryKey: ['timesheets'] })
                toast.success('Timer stopped.')
              })
            } else {
              setOpen(true)
            }
          }}
        >
          {running.length > 0 ? <Pause size={16} /> : <Play size={16} />}
        </Button>

        {running.length > 0 && (
          <span className='h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500' />
        )}

        <span
          className={cn(
            'font-mono tabular-nums',
            running.length > 0 ? 'text-foreground' : 'text-muted-foreground/60'
          )}
          aria-live='polite'
        >
          <TickingClock begin={running.length > 0 ? running[running.length - 1].begin : undefined} />
        </span>

        <span className='hidden min-w-0 max-w-40 truncate sm:block'>
          {running.length > 0
            ? running.length === 1
              ? (running[0].description ?? activityName(running[0]) ?? 'Running timer')
              : `${running.length} timers running`
            : 'Start a timer'}
        </span>

        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0 rounded-full'
            aria-label='Timer options'
          >
            <Ellipsis size={16} />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent align='end' className='w-80'>
        <div className='space-y-4'>
          {isLoading ? (
            <div className='flex justify-center py-4'>
              <Loader size={18} className='animate-spin' />
            </div>
          ) : (
            <>
              {running.map((t) => (
                <div key={t.id} className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <span className='h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500' />
                    <span className='truncate text-sm font-medium'>
                      {t.description ?? activityName(t) ?? `Timer #${t.id}`}
                    </span>
                    <span className='ml-auto font-mono tabular-nums text-xs text-muted-foreground'>
                      <TickingClock begin={t.begin} />
                    </span>
                  </div>
                  <RunningEditor key={t.id} timesheet={t} />
                </div>
              ))}
              {running.length > 0 && (
                <div className='border-t pt-3'>
                  <p className='mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Start another timer
                  </p>
                  <StartEditor onStarted={() => setOpen(false)} />
                </div>
              )}
              {running.length === 0 && (
                <StartEditor onStarted={() => setOpen(false)} />
              )}
            </>
          )}
        </div>
        <RecentList onRestart={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
