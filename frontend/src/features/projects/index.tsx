import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProjectsDialogs } from './components/projects-dialogs'
import { ProjectsPrimaryButtons } from './components/projects-primary-buttons'
import { ProjectsProvider } from './components/projects-provider'
import { ProjectsTable } from './components/projects-table'

const route = getRouteApi('/_authenticated/projects/')

export function Projects() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <ProjectsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Project List</h2>
            <p className='text-muted-foreground'>
              Manage your projects and their details here.
            </p>
          </div>
          <ProjectsPrimaryButtons />
        </div>
        <ProjectsTable search={search} navigate={navigate} />
      </Main>

      <ProjectsDialogs />
    </ProjectsProvider>
  )
}
