import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi, configApi } from '@/lib/api'
import { prefValue } from '@/lib/preferences'
import { WEEKDAYS } from '@/lib/i18n'
import { handleServerError } from '@/lib/handle-server-error'
import { FormDescription, FormItem, FormLabel } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DisplayForm() {
  const { data: user, isPending: userPending } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.me(),
  })

  const { data: timesheetConfig, isPending: configPending } = useQuery({
    queryKey: ['config', 'timesheet'],
    queryFn: () => configApi.timesheet(),
  })

  const saveWeekday = useMutation({
    mutationFn: (firstWeekday: string) =>
      usersApi.patchPreferences(user!.id, [{ name: 'first_weekday', value: firstWeekday }]),
    onSuccess: () => toast.success('First weekday saved.'),
    onError: handleServerError,
  })

  if (userPending || !user) {
    return (
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' />
        Loading preferences...
      </div>
    )
  }

  const prefs = user.preferences ?? []
  const currentWeekday = prefValue(prefs, 'first_weekday') ?? 'monday'

  return (
    <div className='space-y-8'>
      <FormItem>
        <FormLabel>First day of week</FormLabel>
        <Select
          value={currentWeekday}
          onValueChange={(v) => saveWeekday.mutate(v)}
          disabled={saveWeekday.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Sets the day used to start calendar and week-based views.
        </FormDescription>
      </FormItem>

      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-medium'>Timesheet system defaults</h3>
          <p className='text-sm text-muted-foreground'>
            These are global system-wide settings configured by your
            administrator. They are not user-editable.
          </p>
        </div>

        <Alert variant='default'>
          <AlertDescription>
            Timesheet behavior is defined system-wide by the administrator and
            cannot be changed per user.
          </AlertDescription>
        </Alert>

        {configPending ? (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Loader2 className='size-4 animate-spin' />
            Loading defaults...
          </div>
        ) : timesheetConfig ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className='font-medium'>Tracking mode</TableCell>
                <TableCell className='capitalize'>{timesheetConfig.trackingMode}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Default begin time</TableCell>
                <TableCell>{timesheetConfig.defaultBeginTime}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Active entries hard limit</TableCell>
                <TableCell>{timesheetConfig.activeEntriesHardLimit}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Allow future times</TableCell>
                <TableCell>{timesheetConfig.isAllowFutureTimes ? 'Yes' : 'No'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Allow overlapping entries</TableCell>
                <TableCell>{timesheetConfig.isAllowOverlapping ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : null}
      </div>
    </div>
  )
}
