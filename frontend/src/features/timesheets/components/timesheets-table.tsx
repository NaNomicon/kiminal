import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  activitiesApi,
  customersApi,
  projectsApi,
  tagsApi,
  timesheetsApi,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { timesheetsColumns as columns } from './timesheets-columns'

type DataTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function TimesheetsTable({ search, navigate }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const {
    globalFilter,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'term' },
    columnFilters: [
      { columnId: 'customer', searchKey: 'customer', type: 'array' },
      { columnId: 'project', searchKey: 'project', type: 'array' },
      { columnId: 'activity', searchKey: 'activity', type: 'array' },
      { columnId: 'tags', searchKey: 'tags', type: 'array' },
      { columnId: 'exported', searchKey: 'exported', type: 'array' },
      { columnId: 'billable', searchKey: 'billable', type: 'array' },
    ],
  })

  const getArrayFilter = (id: string) =>
    columnFilters.find((f) => f.id === id)?.value as unknown[] | undefined

  const customerFilter = getArrayFilter('customer')
  const projectFilter = getArrayFilter('project')
  const activityFilter = getArrayFilter('activity')
  const tagsFilter = getArrayFilter('tags')
  const exportedFilter = getArrayFilter('exported')
  const billableFilter = getArrayFilter('billable')

  const orderBy = sorting[0]?.id
  const order = sorting[0]?.desc ? 'DESC' : 'ASC'

  const { data: customers } = useQuery({
    queryKey: ['customers', 'options'],
    queryFn: () => customersApi.list({ size: 100 }),
  })
  const { data: projects } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsApi.list({ size: 100 }),
  })
  const { data: activities } = useQuery({
    queryKey: ['activities', 'options'],
    queryFn: () => activitiesApi.list({ size: 100 }),
  })
  const { data: tags } = useQuery({
    queryKey: ['tags', 'options'],
    queryFn: () => tagsApi.list({ size: 100 }),
  })

  const { data: page, isFetching } = useQuery({
    queryKey: [
      'timesheets',
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      customerFilter,
      projectFilter,
      activityFilter,
      tagsFilter,
      exportedFilter,
      billableFilter,
      orderBy,
      order,
    ],
    queryFn: () =>
      timesheetsApi.list({
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        orderBy,
        order,
        term: globalFilter || undefined,
        customers: customerFilter,
        projects: projectFilter,
        activities: activityFilter,
        tags: tagsFilter,
        exported: exportedFilter,
        billable: billableFilter,
        full: true,
      }),
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: page?.data ?? [],
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: page?.totalPages ?? 0,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(page?.totalPages ?? 0)
  }, [table, ensurePageInRange, page?.totalPages])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter timesheets...'
        filters={[
          {
            columnId: 'customer',
            title: 'Customer',
            options: (customers?.data ?? []).map((c) => ({
              label: c.name,
              value: String(c.id),
            })),
          },
          {
            columnId: 'project',
            title: 'Project',
            options: (projects?.data ?? []).map((p) => ({
              label: p.name,
              value: String(p.id),
            })),
          },
          {
            columnId: 'activity',
            title: 'Activity',
            options: (activities?.data ?? []).map((a) => ({
              label: a.name,
              value: String(a.id),
            })),
          },
          {
            columnId: 'tags',
            title: 'Tags',
            options: (tags?.data ?? []).map((t) => ({
              label: t.name,
              value: t.name,
            })),
          },
          {
            columnId: 'exported',
            title: 'Exported',
            options: [
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
          },
          {
            columnId: 'billable',
            title: 'Billable',
            options: [
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
