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

function usePeriodHours(label: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ['dashboard', label, toDateTimeLocal(from), toDateTimeLocal(to)],
    queryFn: async () => {
      const page = await timesheetsApi.list({
        from: toDateTimeLocal(from),
        to: toDateTimeLocal(to),
        size: 500,
      })
      return sumDurations(page.data)
    },
  })
}

function useCounts() {
  const customers = useQuery({
    queryKey: ['dashboard', 'counts', 'customers'],
    queryFn: () => customersApi.list({ size: 1 }).then((p) => p.total),
  })
  const projects = useQuery({
    queryKey: ['dashboard', 'counts', 'projects'],
    queryFn: () => projectsApi.list({ size: 1 }).then((p) => p.total),
  })
  const activities = useQuery({
    queryKey: ['dashboard', 'counts', 'activities'],
    queryFn: () => activitiesApi.list({ size: 1 }).then((p) => p.total),
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
  const today = usePeriodHours('today', startOfDay(now), now)
  const week = usePeriodHours('week', startOfWeek(now), now)
  const month = usePeriodHours('month', startOfMonth(now), now)
  const year = usePeriodHours('year', startOfYear(now), now)
  const { customers, projects, activities } = useCounts()

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStart = startOfDay(weekAgo)
  const last7 = useQuery({
    queryKey: ['dashboard', 'last7', toDateTimeLocal(weekAgoStart), toDateTimeLocal(now)],
    queryFn: async () => {
      const page = await timesheetsApi.list({
        from: toDateTimeLocal(weekAgoStart),
        to: toDateTimeLocal(now),
        size: 500,
      })
      const buckets = new Array<number>(7).fill(0)
      for (const ts of page.data) {
        const day = new Date(ts.begin)
        const idx = Math.floor(
          (startOfDay(day).getTime() - weekAgoStart.getTime()) / 86400000
        )
        if (idx >= 0 && idx < 7) buckets[idx] += ts.duration ?? 0
      }
      return buckets
    },
  })

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
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Today' value={formatDuration(today.data ?? 0)} />
        <StatCard title='This Week' value={formatDuration(week.data ?? 0)} />
        <StatCard title='This Month' value={formatDuration(month.data ?? 0)} />
        <StatCard title='This Year' value={formatDuration(year.data ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <WeekBars totalSecondsByDay={last7.data ?? []} />
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
