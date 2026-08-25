import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TimerPill } from '@/features/timesheets/components/timer-pill'

/**
 * Shared header rendered once above every authenticated page. Carries the
 * global search, the running-timer pill (top navigation bar placement) and the
 * common right-side controls.
 */
export function AppHeader() {
  return (
    <Header fixed>
      <Search className='me-auto' />
      <TimerPill />
      <ThemeSwitch />
      <ProfileDropdown />
    </Header>
  )
}
