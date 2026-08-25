import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Kimai REST API client.
 *
 * Single axios instance for all backend calls. Auth is a Bearer token
 * (minted in the Kimai UI, stored via the zustand auth store). Kimai returns
 * `{ message, code }` on errors and paginates via response headers
 * (`X-Total-Count`, `X-Total-Pages`) rather than the body.
 */

// VITE_KIMAI_URL is the full origin (e.g. http://localhost:8001); the API lives under /api.
const configuredUrl = import.meta.env.VITE_KIMAI_URL || '/api'
export const API_BASE_URL = configuredUrl.endsWith('/api')
  ? configuredUrl
  : `${configuredUrl.replace(/\/$/, '')}/api`

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Types (mirror Kimai entity serialization) ----

export interface Timesheet {
  id: number
  begin: string
  end: string | null
  duration: number | null
  break: number | null
  description: string | null
  exported: boolean
  billable: boolean
  rate: number
  internalRate: number | null
  fixedRate: number | null
  hourlyRate: number | null
  tags: string[]
  // present when `full=1` or `Expanded` group
  activity?: Activity | number
  project?: Project | number
  user?: User | number
  metaFields?: Record<string, unknown>
}

export interface Customer {
  id: number
  name: string
  number: string | null
  comment: string | null
  visible: boolean
  billable: boolean
  company: string | null
  vatId: string | null
  contact: string | null
  address: string | null
  country: string | null
  currency: string
  phone: string | null
  fax: string | null
  mobile: string | null
  email: string | null
  homepage: string | null
  timezone: string | null
  metaFields?: Record<string, unknown>
}

export interface Project {
  id: number
  customer: number
  name: string
  orderNumber: string | null
  orderDate: string | null
  start: string | null
  end: string | null
  comment: string | null
  visible: boolean
  billable: boolean
  globalActivities: boolean
  number: string | null
  parentTitle?: string
  metaFields?: Record<string, unknown>
}

export interface Activity {
  id: number
  project: number
  name: string
  comment: string | null
  visible: boolean
  billable: boolean
  number: string | null
  parentTitle?: string
  metaFields?: Record<string, unknown>
}

export interface User {
  id: number
  alias: string | null
  title: string | null
  avatar: string | null
  username: string
  email: string | null
  accountNumber: string | null
  enabled: boolean
  roles: string[]
  language: string
  locale: string
  timezone: string
  color: string | null
  initials: string
  teams?: number[]
  preferences?: UserPreference[]
}

export interface UserPreference {
  name: string
  value: string | null
}

/** Returned at creation time — includes the raw secret token (shown only once). */
export interface AccessToken {
  id: number
  token: string
  name: string | null
}

/** Listed via GET — metadata only, no raw token secret. */
export interface AccessTokenList {
  id: number
  name: string | null
  lastUsage?: string | null
}

export interface Tag {
  id: number
  name: string
  color: string | null
  visible: boolean
}

export interface TimesheetConfig {
  trackingMode: string
  defaultBeginTime: string
  activeEntriesHardLimit: number
  isAllowFutureTimes: boolean
  isAllowOverlapping: boolean
}

// ---- Pagination ----

export interface Page<T> {
  data: T[]
  total: number
  totalPages: number
  page: number
  perPage: number
}

export interface ListParams {
  page?: number
  size?: number
  orderBy?: string
  order?: 'ASC' | 'DESC'
  term?: string
  full?: boolean
  [key: string]: unknown
}

function parsePage<T>(response: {
  data: T[]
  headers: Record<string, unknown>
}): Page<T> {
  const num = (v: unknown) => (v === undefined || v === null ? 0 : Number(v))
  return {
    data: response.data,
    total: num(response.headers['x-total-count']),
    totalPages: num(response.headers['x-total-pages']),
    page: num(response.headers['x-page']),
    perPage: num(response.headers['x-per-page']),
  }
}

async function getList<T>(url: string, params?: ListParams): Promise<Page<T>> {
  const response = await api.get<T[]>(url, { params })
  return parsePage<T>(response)
}

// ---- Fetchers ----

export const timesheetsApi = {
  list: (params?: ListParams) => getList<Timesheet>('/timesheets', params),
  recent: (params?: ListParams) =>
    getList<Timesheet>('/timesheets/recent', params),
  active: (params?: ListParams) =>
    getList<Timesheet>('/timesheets/active', params),
  get: (id: number) =>
    api.get<Timesheet>(`/timesheets/${id}`).then((r) => r.data),
  create: (data: Partial<Timesheet>) =>
    api.post<Timesheet>('/timesheets', data).then((r) => r.data),
  update: (id: number, data: Partial<Timesheet>) =>
    api.patch<Timesheet>(`/timesheets/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/timesheets/${id}`),
  stop: (id: number) =>
    api.patch<Timesheet>(`/timesheets/${id}/stop`).then((r) => r.data),
  restart: (id: number) =>
    api.patch<Timesheet>(`/timesheets/${id}/restart`).then((r) => r.data),
}

export const customersApi = {
  list: (params?: ListParams) => getList<Customer>('/customers', params),
  get: (id: number) =>
    api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (data: Partial<Customer>) =>
    api.post<Customer>('/customers', data).then((r) => r.data),
  update: (id: number, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/customers/${id}`),
}

export const projectsApi = {
  list: (params?: ListParams) => getList<Project>('/projects', params),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: Partial<Project>) =>
    api.post<Project>('/projects', data).then((r) => r.data),
  update: (id: number, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

export const activitiesApi = {
  list: (params?: ListParams) => getList<Activity>('/activities', params),
  get: (id: number) =>
    api.get<Activity>(`/activities/${id}`).then((r) => r.data),
  create: (data: Partial<Activity>) =>
    api.post<Activity>('/activities', data).then((r) => r.data),
  update: (id: number, data: Partial<Activity>) =>
    api.patch<Activity>(`/activities/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/activities/${id}`),
}

export const usersApi = {
  list: (params?: ListParams) => getList<User>('/users', params),
  get: (id: number) => api.get<User>(`/users/${id}`).then((r) => r.data),
  me: () => api.get<User>('/users/me').then((r) => r.data),
  create: (data: Partial<User>) =>
    api.post<User>('/users', data).then((r) => r.data),
  update: (id: number, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/users/${id}`),
  patchPreferences: (
    id: number,
    preferences: { name: string; value: string | boolean | null }[]
  ) =>
    api
      .patch<User>(`/users/${id}/preferences`, preferences)
      .then((r) => r.data),
  listTokens: () =>
    api.get<AccessTokenList[]>('/users/api-token').then((r) => r.data),
  createToken: (name?: string) =>
    api.post<AccessToken>('/users/api-token', { name }).then((r) => r.data),
  deleteToken: (id: number) => api.delete(`/users/api-token/${id}`),
}

export const tagsApi = {
  list: (params?: ListParams) => getList<Tag>('/tags', params),
}

export const configApi = {
  timesheet: () =>
    api.get<TimesheetConfig>('/config/timesheet').then((r) => r.data),
}

export const ping = () => api.get('/ping').then((r) => r.data)

export type { AxiosRequestConfig }
