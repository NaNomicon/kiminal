import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi, type User } from '@/lib/api'
import { LANGUAGES, LOCALES, timezoneOptions } from '@/lib/i18n'
import { handleServerError } from '@/lib/handle-server-error'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const profileFormSchema = z.object({
  alias: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  accountNumber: z.string().max(100).optional(),
  email: z.string().email('Please enter a valid email address.').max(180),
  language: z.string().min(1, 'Please select a language.'),
  locale: z.string().min(1, 'Please select a locale.'),
  timezone: z.string().min(1, 'Please select a timezone.'),
  color: z.string().max(7).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

function toFormValues(user: User): ProfileFormValues {
  return {
    alias: user.alias ?? '',
    title: user.title ?? '',
    accountNumber: user.accountNumber ?? '',
    email: user.email ?? '',
    language: user.language,
    locale: user.locale,
    timezone: user.timezone,
    color: user.color ?? '',
  }
}

export function ProfileForm() {
  const { auth } = useAuthStore()

  const { data: user, isPending } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.me(),
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: user ? toFormValues(user) : undefined,
  })

  const save = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      usersApi.update(user!.id, {
        alias: values.alias || null,
        title: values.title || null,
        accountNumber: values.accountNumber || null,
        email: values.email,
        language: values.language,
        locale: values.locale,
        timezone: values.timezone,
        color: values.color || null,
      }),
    onSuccess: async (updated) => {
      auth.setUser({
        accountNo: updated.accountNumber ?? '',
        email: updated.email ?? '',
        role: updated.roles,
        exp: 0,
      })
      toast.success('Profile updated.')
    },
    onError: handleServerError,
  })

  if (isPending) {
    return (
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' />
        Loading profile...
      </div>
    )
  }

  const timezones = timezoneOptions()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => save.mutate(data))} className='space-y-8'>
        <FormField
          control={form.control}
          name='alias'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alias</FormLabel>
              <FormControl>
                <Input placeholder='Your display name' {...field} />
              </FormControl>
              <FormDescription>Public display name shown across Kimai.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Developer' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='accountNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account number</FormLabel>
              <FormControl>
                <Input placeholder='e.g. EMP-123' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' placeholder='you@example.com' {...field} />
              </FormControl>
              <FormDescription>Used for notifications and login.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='language'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a language' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='locale'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Locale</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a locale' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOCALES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='timezone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a timezone' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='max-h-72'>
                  {timezones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='color'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input type='color' className='h-10 w-16' {...field} />
              </FormControl>
              <FormDescription>Accent color used to identify you.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={save.isPending}>
          {save.isPending && <Loader2 className='size-4 animate-spin' />}
          Update profile
        </Button>
      </form>
    </Form>
  )
}
