import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { billableBadge, exportedBadge } from '../data/data'
import { type Timesheet } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const timesheetsColumns: ColumnDef<Timesheet>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    meta: {
      className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'begin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Begin' />
    ),
    cell: ({ row }) => (
      <div className='ps-3 text-nowrap'>
        {new Date(row.getValue('begin')).toLocaleString()}
      </div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'end',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='End' />
    ),
    cell: ({ row }) => {
      const end = row.getValue('end') as string | null
      return <div className='text-nowrap'>{end ? new Date(end).toLocaleString() : '-'}</div>
    },
  },
  {
    id: 'customer',
    accessorFn: (row) => row.customer?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ row }) => <div>{row.original.customer?.name ?? '-'}</div>,
  },
  {
    id: 'project',
    accessorFn: (row) => row.project?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Project' />
    ),
    cell: ({ row }) => <div>{row.original.project?.name ?? '-'}</div>,
  },
  {
    id: 'activity',
    accessorFn: (row) => row.activity?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Activity' />
    ),
    cell: ({ row }) => <div>{row.original.activity?.name ?? '-'}</div>,
  },
  {
    id: 'tags',
    accessorFn: (row) => row.tags?.join(', '),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tags' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-wrap gap-1'>
        {(row.original.tags ?? []).length ? (
          (row.original.tags ?? []).map((t) => (
            <Badge key={t} variant='secondary'>
              {t}
            </Badge>
          ))
        ) : (
          <span>-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Duration' />
    ),
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number | null
      if (duration === null) return <div>-</div>
      const hours = Math.floor(duration / 3600)
      const minutes = Math.floor((duration % 3600) / 60)
      return <div className='text-nowrap'>{hours}h {minutes}m</div>
    },
  },
  {
    accessorKey: 'rate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Rate' />
    ),
    cell: ({ row }) => <div>{row.getValue('rate')}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('description') ?? '-'}</LongText>
    ),
  },
  {
    accessorKey: 'billable',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Billable' />
    ),
    cell: ({ row }) => {
      const billable = row.getValue('billable') as boolean
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', billableBadge[String(billable) as 'true' | 'false'])}>
            {billable ? 'Yes' : 'No'}
          </Badge>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'exported',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Exported' />
    ),
    cell: ({ row }) => {
      const exported = row.getValue('exported') as boolean
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', exportedBadge[String(exported) as 'true' | 'false'])}>
            {exported ? 'Yes' : 'No'}
          </Badge>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
