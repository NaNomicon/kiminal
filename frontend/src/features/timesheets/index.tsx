import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { TimesheetsDialogs } from './components/timesheets-dialogs'
import { TimesheetsPrimaryButtons } from './components/timesheets-primary-buttons'
import { TimesheetsProvider } from './components/timesheets-provider'
import { TimesheetsTable } from './components/timesheets-table'

const route = getRouteApi('/_authenticated/timesheets/')

export function Timesheets() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <TimesheetsProvider>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Timesheet List</h2>
            <p className='text-muted-foreground'>
              Manage your timesheets and their details here.
            </p>
          </div>
          <TimesheetsPrimaryButtons />
        </div>
        <TimesheetsTable search={search} navigate={navigate} />
      </Main>

      <TimesheetsDialogs />
    </TimesheetsProvider>
  )
}
