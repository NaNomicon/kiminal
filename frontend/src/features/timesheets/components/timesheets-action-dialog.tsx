'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { activitiesApi, projectsApi, timesheetsApi } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Timesheet } from '../data/schema'

const formSchema = z.object({
  begin: z.string().min(1, 'Begin time is required.'),
  end: z.string().optional(),
  project: z.number().min(1, 'Project is required.'),
  activity: z.number().min(1, 'Activity is required.'),
  description: z.string().optional(),
  billable: z.boolean(),
  exported: z.boolean(),
})
type TimesheetForm = z.infer<typeof formSchema>

type TimesheetActionDialogProps = {
  currentRow?: Timesheet
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TimesheetsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: TimesheetActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()
  const { data: projects } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsApi.list({ size: 100 }),
  })
  const { data: activities } = useQuery({
    queryKey: ['activities', 'options'],
    queryFn: () => activitiesApi.list({ size: 100 }),
  })
  const form = useForm<TimesheetForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          begin: toLocalInput(currentRow.begin),
          end: toLocalInput(currentRow.end),
          project:
            typeof currentRow.project === 'number' ? currentRow.project : 0,
          activity:
            typeof currentRow.activity === 'number' ? currentRow.activity : 0,
          description: currentRow.description ?? '',
          billable: currentRow.billable,
          exported: currentRow.exported,
        }
      : {
          begin: '',
          end: '',
          project: 0,
          activity: 0,
          description: '',
          billable: true,
          exported: false,
        },
  })

  const mutation = useMutation({
    mutationFn: (values: TimesheetForm) => {
      const payload = {
        begin: new Date(values.begin).toISOString(),
        end: values.end ? new Date(values.end).toISOString() : null,
        project: values.project,
        activity: values.activity,
        description: values.description || null,
        billable: values.billable,
        exported: values.exported,
      }
      return isEdit
        ? timesheetsApi.update(currentRow.id, payload)
        : timesheetsApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      toast.success(isEdit ? 'Timesheet updated.' : 'Timesheet created.')
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => handleServerError(error),
  })

  const onSubmit = (values: TimesheetForm) => {
    mutation.mutate(values)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? 'Edit Timesheet' : 'Add New Timesheet'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the timesheet here. '
              : 'Create new timesheet here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='timesheet-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='begin'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Begin</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='end'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>End</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='project'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Project
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={
                        field.value ? String(field.value) : undefined
                      }
                      onValueChange={(v) => field.onChange(Number(v))}
                      placeholder='Select a project'
                      className='col-span-4'
                      items={projects?.data.map((p) => ({
                        label: p.name,
                        value: String(p.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='activity'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Activity
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={
                        field.value ? String(field.value) : undefined
                      }
                      onValueChange={(v) => field.onChange(Number(v))}
                      placeholder='Select an activity'
                      className='col-span-4'
                      items={activities?.data.map((a) => ({
                        label: a.name,
                        value: String(a.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='What did you work on?'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='billable'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Billable
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='col-span-4'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='exported'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Exported
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='col-span-4'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button
            type='submit'
            form='timesheet-form'
            disabled={mutation.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
