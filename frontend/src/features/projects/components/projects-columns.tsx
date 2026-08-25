import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { visibleBadge } from '../data/data'
import { type Project } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const projectsColumns = (
  customerNames: Map<number, string>
): ColumnDef<Project>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('name')}</LongText>
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
    accessorKey: 'customer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ row }) => {
      const id = row.getValue('customer') as number
      return <div>{customerNames.get(id) ?? '-'}</div>
    },
  },
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order Number' />
    ),
    cell: ({ row }) => <div>{row.getValue('orderNumber') ?? '-'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'start',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Start' />
    ),
    cell: ({ row }) => <div>{row.getValue('start') ?? '-'}</div>,
  },
  {
    accessorKey: 'end',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='End' />
    ),
    cell: ({ row }) => <div>{row.getValue('end') ?? '-'}</div>,
  },
  {
    accessorKey: 'visible',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Visible' />
    ),
    cell: ({ row }) => {
      const visible = row.getValue('visible') as boolean
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn(
              'capitalize',
              visibleBadge[String(visible) as 'true' | 'false']
            )}
          >
            {visible ? 'Yes' : 'No'}
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
