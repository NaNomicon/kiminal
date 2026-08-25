import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Projects } from '@/features/projects'

const projectsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  term: z.string().optional().catch(''),
  customer: z.array(z.number()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/projects/')({
  validateSearch: projectsSearchSchema,
  component: Projects,
})
