import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { CustomersDialogs } from './components/customers-dialogs'
import { CustomersPrimaryButtons } from './components/customers-primary-buttons'
import { CustomersProvider } from './components/customers-provider'
import { CustomersTable } from './components/customers-table'

const route = getRouteApi('/_authenticated/customers/')

export function Customers() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <CustomersProvider>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Customer List</h2>
            <p className='text-muted-foreground'>
              Manage your customers and their details here.
            </p>
          </div>
          <CustomersPrimaryButtons />
        </div>
        <CustomersTable search={search} navigate={navigate} />
      </Main>

      <CustomersDialogs />
    </CustomersProvider>
  )
}
