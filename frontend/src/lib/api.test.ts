import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { api, timesheetsApi } from './api'

function mockAdapter(
  handler: (config: { headers: Record<string, unknown> }) => {
    data: unknown
    headers?: Record<string, string>
  }
) {
  api.defaults.adapter = async (config) => {
    const { data, headers = {} } = handler(config)
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers,
      config,
    }
  }
}

describe('api Bearer interceptor', () => {
  beforeEach(() => {
    useAuthStore.getState().auth.reset()
  })

  it('attaches the stored token as a Bearer header', async () => {
    useAuthStore.getState().auth.setAccessToken('abc123')
    let seen: string | undefined
    mockAdapter((config) => {
      seen = config.headers.Authorization as string
      return { data: [] }
    })

    await api.get('/timesheets')

    expect(seen).toBe('Bearer abc123')
  })

  it('sends no Authorization header when no token is stored', async () => {
    let seen: string | undefined
    mockAdapter((config) => {
      seen = config.headers.Authorization as string
      return { data: [] }
    })

    await api.get('/timesheets')

    expect(seen).toBeUndefined()
  })
})

describe('pagination parsing', () => {
  it('parses X-Total-* headers into a Page', async () => {
    mockAdapter(() => ({
      data: [{ id: 1 }],
      headers: {
        'x-total-count': '37',
        'x-total-pages': '4',
        'x-page': '2',
        'x-per-page': '10',
      },
    }))

    const page = await timesheetsApi.list({ page: 2, size: 10 })

    expect(page.data).toEqual([{ id: 1 }])
    expect(page.total).toBe(37)
    expect(page.totalPages).toBe(4)
    expect(page.page).toBe(2)
    expect(page.perPage).toBe(10)
  })

  it('defaults to zero when pagination headers are absent', async () => {
    mockAdapter(() => ({ data: [] }))

    const page = await timesheetsApi.list()

    expect(page.total).toBe(0)
    expect(page.totalPages).toBe(0)
    expect(page.page).toBe(0)
    expect(page.perPage).toBe(0)
  })
})
