import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Timesheets } from '@/features/timesheets'

const timesheetsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  term: z.string().optional().catch(''),
  customer: z.array(z.number()).optional().catch([]),
  project: z.array(z.number()).optional().catch([]),
  activity: z.array(z.number()).optional().catch([]),
  tags: z.array(z.string()).optional().catch([]),
  exported: z.boolean().optional().catch(undefined),
  billable: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/timesheets/')({
  validateSearch: timesheetsSearchSchema,
  component: Timesheets,
})
