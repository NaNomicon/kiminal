import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { FormDescription, FormItem, FormLabel } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SKIN_OPTIONS = [
  ['auto', 'Automatic'],
  ['default', 'Light'],
  ['dark', 'Dark'],
] as const

export function AppearanceForm() {
  const { data: user, isPending } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.me(),
  })

  const save = useMutation({
    mutationFn: (skin: string) =>
      usersApi.patchPreferences(user!.id, [{ name: 'skin', value: skin }]),
    onSuccess: () => toast.success('Appearance preference saved.'),
    onError: handleServerError,
  })

  if (isPending || !user) {
    return (
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' />
        Loading preferences...
      </div>
    )
  }

  return (
    <FormItem>
      <FormLabel>Skin</FormLabel>
      <Select
        defaultValue={SKIN_OPTIONS[0][0]}
        onValueChange={(v) => save.mutate(v)}
        disabled={save.isPending}
      >
        <SelectTrigger>
          <SelectValue placeholder='Select a skin' />
        </SelectTrigger>
        <SelectContent>
          {SKIN_OPTIONS.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        Automatic follows the system light/dark preference.
      </FormDescription>
    </FormItem>
  )
}
