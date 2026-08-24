import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Activities } from '@/features/activities'

const activitiesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  term: z.string().optional().catch(''),
  project: z.array(z.number()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/activities/')({
  validateSearch: activitiesSearchSchema,
  component: Activities,
})
