'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customersApi, projectsApi } from '@/lib/api'
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
import { type Project } from '../data/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  customer: z.number().min(1, 'Customer is required.'),
  orderNumber: z.string().optional(),
  comment: z.string().optional(),
  visible: z.boolean(),
  billable: z.boolean(),
})
type ProjectForm = z.infer<typeof formSchema>

type ProjectActionDialogProps = {
  currentRow?: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ProjectActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()
  const { data: customers } = useQuery({
    queryKey: ['customers', 'options'],
    queryFn: () => customersApi.list({ size: 100 }),
  })
  const form = useForm<ProjectForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          customer: currentRow.customer,
          orderNumber: currentRow.orderNumber ?? '',
          comment: currentRow.comment ?? '',
          visible: currentRow.visible,
          billable: currentRow.billable,
        }
      : {
          name: '',
          customer: 0,
          orderNumber: '',
          comment: '',
          visible: true,
          billable: true,
        },
  })

  const mutation = useMutation({
    mutationFn: (values: ProjectForm) =>
      isEdit
        ? projectsApi.update(currentRow.id, values)
        : projectsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(isEdit ? 'Project updated.' : 'Project created.')
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => handleServerError(error),
  })

  const onSubmit = (values: ProjectForm) => {
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
          <DialogTitle>{isEdit ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the project here. ' : 'Create new project here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='project-form'
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
                        placeholder='Website Redesign'
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
                name='customer'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Customer</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                      placeholder='Select a customer'
                      className='col-span-4'
                      items={customers?.data.map((c) => ({
                        label: c.name,
                        value: String(c.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='orderNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Order Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='PO-1234'
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
                name='comment'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Comment</FormLabel>
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
                    <FormLabel className='col-span-2 text-end'>Visible</FormLabel>
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
                    <FormLabel className='col-span-2 text-end'>Billable</FormLabel>
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
          <Button type='submit' form='project-form' disabled={mutation.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
