import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { activitiesApi, projectsApi } from '@/lib/api'
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
import { activitiesColumns } from './activities-columns'
import { DataTableBulkActions } from './data-table-bulk-actions'

type DataTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ActivitiesTable({ search, navigate }: DataTableProps) {
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
      { columnId: 'project', searchKey: 'project', type: 'array' },
    ],
  })

  const projectFilter = columnFilters.find((f) => f.id === 'project')?.value as
    number[] | undefined

  const orderBy = sorting[0]?.id
  const order = sorting[0]?.desc ? 'DESC' : 'ASC'

  const { data: projects } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsApi.list({ size: 100 }),
  })

  const projectNames = new Map(
    (projects?.data ?? []).map((p) => [p.id, p.name])
  )
  const columns = activitiesColumns(projectNames)

  const { data: page, isFetching } = useQuery({
    queryKey: [
      'activities',
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      projectFilter,
      orderBy,
      order,
    ],
    queryFn: () =>
      activitiesApi.list({
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        orderBy,
        order,
        term: globalFilter || undefined,
        project: projectFilter,
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
        searchPlaceholder='Filter activities...'
        filters={[
          {
            columnId: 'project',
            title: 'Project',
            options: (projects?.data ?? []).map((p) => ({
              label: p.name,
              value: String(p.id),
            })),
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
