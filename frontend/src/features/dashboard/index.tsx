import { useQuery } from '@tanstack/react-query'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activitiesApi, customersApi, projectsApi, timesheetsApi } from '@/lib/api'

function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

function startOfWeek(d: Date): Date {
  // Kimai weeks start on Monday.
  const out = startOfDay(d)
  const day = (out.getDay() + 6) % 7 // Monday = 0
  out.setDate(out.getDate() - day)
  return out
}

function startOfMonth(d: Date): Date {
  const out = startOfDay(d)
  out.setDate(1)
  return out
}

function startOfYear(d: Date): Date {
  const out = startOfDay(d)
  out.setMonth(0, 1)
  return out
}

/** Local datetime serialized as Kimai's `Y-m-d\TH:i:s`. */
function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function sumDurations(timesheets: readonly { duration: number | null }[]): number {
  return timesheets.reduce((sum, ts) => sum + (ts.duration ?? 0), 0)
}

// Single aggregated fetch powers all four period cards + the 7-day chart. Key is
// day-granular so re-renders don't churn new keys (seconds-precision caused a refetch every render).
const PERIOD_STALE_MS = 60_000

function usePeriodTimesheets(from: Date) {
  return useQuery({
    queryKey: ['dashboard', 'period', from.toDateString()],
    queryFn: async () => {
      const page = await timesheetsApi.list({
        from: toDateTimeLocal(from),
        to: toDateTimeLocal(new Date()),
        size: 500,
      })
      return { data: page.data, total: page.total }
    },
    staleTime: PERIOD_STALE_MS,
    refetchInterval: PERIOD_STALE_MS,
  })
}

function useCounts() {
  const customers = useQuery({
    queryKey: ['dashboard', 'counts', 'customers'],
    queryFn: () => customersApi.list({ size: 1 }).then((p) => p.total),
    staleTime: 5 * 60_000,
  })
  const projects = useQuery({
    queryKey: ['dashboard', 'counts', 'projects'],
    queryFn: () => projectsApi.list({ size: 1 }).then((p) => p.total),
    staleTime: 5 * 60_000,
  })
  const activities = useQuery({
    queryKey: ['dashboard', 'counts', 'activities'],
    queryFn: () => activitiesApi.list({ size: 1 }).then((p) => p.total),
    staleTime: 5 * 60_000,
  })
  return { customers, projects, activities }
}

type StatCardProps = {
  title: string
  value: string
  subtitle?: string
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle && <p className='text-xs text-muted-foreground'>{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function WeekBars({ totalSecondsByDay }: { totalSecondsByDay: number[] }) {
  const max = Math.max(...totalSecondsByDay, 1)
  const labels = totalSecondsByDay.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  return (
    <div className='flex h-40 items-end gap-2'>
      {totalSecondsByDay.map((seconds, i) => {
        const height = `${Math.round((seconds / max) * 100)}%`
        const hours = formatDuration(seconds)
        return (
          <div key={i} className='flex flex-1 flex-col items-center justify-end gap-1'>
            <div className='text-xs text-muted-foreground'>{formatDuration(seconds)}</div>
            <div
              className='w-full rounded-md bg-primary/80'
              style={{ height: height === '0%' ? '2px' : height }}
              title={hours}
            />
            <div className='text-xs text-muted-foreground'>
              {labels[i].toLocaleDateString(undefined, { weekday: 'short' })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Dashboard() {
  const now = new Date()
  const yearStart = startOfYear(now)
  const period = usePeriodTimesheets(yearStart)
  const timesheets = period.data?.data ?? []
  const truncated = (period.data?.total ?? timesheets.length) > timesheets.length

  const { customers, projects, activities } = useCounts()

  const totalFor = (from: Date, to: Date) =>
    sumDurations(timesheets.filter((ts) => {
      const b = new Date(ts.begin)
      return b >= from && b <= to
    }))

  const today = totalFor(startOfDay(now), now)
  const week = totalFor(startOfWeek(now), now)
  const month = totalFor(startOfMonth(now), now)
  const year = totalFor(yearStart, now)

  const weekAgoStart = startOfDay(new Date(now.getTime() - 6 * 86400000))
  const last7 = new Array<number>(7).fill(0)
  for (const ts of timesheets) {
    const b = new Date(ts.begin)
    if (b < weekAgoStart || b > now) continue
    const idx = Math.floor((startOfDay(b).getTime() - weekAgoStart.getTime()) / 86400000)
    if (idx >= 0 && idx < 7) last7[idx] += ts.duration ?? 0
  }

  const counts: Array<{ label: string; value: number }> = [
    { label: 'Customers', value: customers.data ?? 0 },
    { label: 'Projects', value: projects.data ?? 0 },
    { label: 'Activities', value: activities.data ?? 0 },
  ]

  return (
    <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Dashboard</h2>
        <p className='text-muted-foreground'>
          Your time tracking at a glance.
        </p>
        {truncated && (
          <p className='mt-1 text-xs text-muted-foreground'>
            Showing the latest {timesheets.length} of {period.data?.total}{' '}
            entries for this year — totals may be incomplete.
          </p>
        )}
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Today' value={formatDuration(today)} />
        <StatCard title='This Week' value={formatDuration(week)} />
        <StatCard title='This Month' value={formatDuration(month)} />
        <StatCard title='This Year' value={formatDuration(year)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <WeekBars totalSecondsByDay={last7} />
        </CardContent>
      </Card>

      <div className='grid gap-4 sm:grid-cols-3'>
        {counts.map((c) => (
          <StatCard key={c.label} title={c.label} value={String(c.value)} />
        ))}
      </div>
    </Main>
  )
}
