import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  PlayCircle,
  Building2,
  Users,
  Settings,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Timesheets',
          url: '/timesheets',
          icon: Clock,
        },
        {
          title: 'Projects',
          url: '/projects',
          icon: FolderKanban,
        },
        {
          title: 'Activities',
          url: '/activities',
          icon: PlayCircle,
        },
        {
          title: 'Customers',
          url: '/customers',
          icon: Building2,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
