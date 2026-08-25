'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { activitiesApi, projectsApi } from '@/lib/api'
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
import { type Activity } from '../data/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  project: z.number().min(1, 'Project is required.'),
  comment: z.string().optional(),
  visible: z.boolean(),
  billable: z.boolean(),
})
type ActivityForm = z.infer<typeof formSchema>

type ActivityActionDialogProps = {
  currentRow?: Activity
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivitiesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ActivityActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()
  const { data: projects } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsApi.list({ size: 100 }),
  })
  const form = useForm<ActivityForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          project: currentRow.project,
          comment: currentRow.comment ?? '',
          visible: currentRow.visible,
          billable: currentRow.billable,
        }
      : {
          name: '',
          project: 0,
          comment: '',
          visible: true,
          billable: true,
        },
  })

  const mutation = useMutation({
    mutationFn: (values: ActivityForm) =>
      isEdit
        ? activitiesApi.update(currentRow.id, values)
        : activitiesApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success(isEdit ? 'Activity updated.' : 'Activity created.')
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => handleServerError(error),
  })

  const onSubmit = (values: ActivityForm) => {
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
            {isEdit ? 'Edit Activity' : 'Add New Activity'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the activity here. '
              : 'Create new activity here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='activity-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Development'
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
                name='comment'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Comment
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Notes'
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
                name='visible'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Visible
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
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button
            type='submit'
            form='activity-form'
            disabled={mutation.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
