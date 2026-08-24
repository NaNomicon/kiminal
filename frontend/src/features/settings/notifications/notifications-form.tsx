import { BellOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function NotificationsForm() {
  return (
    <div className='space-y-4'>
      <Alert variant='default'>
        <BellOff className='size-4' />
        <AlertTitle>Notifications are not exposed via the API</AlertTitle>
        <AlertDescription>
          Kimai's REST API does not expose per-user notification preferences, so
          they cannot be configured from this interface. Notifications are
          managed through the backend email settings and your account's email
          address.
        </AlertDescription>
      </Alert>
      <p className='text-sm text-muted-foreground'>
        If you need to change the address notifications are sent to, update your
        email on the profile page.
      </p>
    </div>
  )
}
