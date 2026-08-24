import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { ActivitiesDialogs } from './components/activities-dialogs'
import { ActivitiesPrimaryButtons } from './components/activities-primary-buttons'
import { ActivitiesProvider } from './components/activities-provider'
import { ActivitiesTable } from './components/activities-table'

const route = getRouteApi('/_authenticated/activities/')

export function Activities() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <ActivitiesProvider>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Activity List</h2>
            <p className='text-muted-foreground'>
              Manage your activities and their details here.
            </p>
          </div>
          <ActivitiesPrimaryButtons />
        </div>
        <ActivitiesTable search={search} navigate={navigate} />
      </Main>

      <ActivitiesDialogs />
    </ActivitiesProvider>
  )
}
