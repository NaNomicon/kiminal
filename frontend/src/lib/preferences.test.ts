import { describe, expect, it } from 'vitest'
import { prefValue, prefBool } from './preferences'
import type { UserPreference } from './api'

const prefs: UserPreference[] = [
  { name: 'first_weekday', value: 'monday' },
  { name: 'daily_stats', value: 'true' },
  { name: 'export_decimal', value: '0' },
  { name: 'skin', value: 'auto' },
]

describe('prefValue', () => {
  it('returns the value for an existing preference', () => {
    expect(prefValue(prefs, 'first_weekday')).toBe('monday')
  })

  it('returns undefined for a missing preference', () => {
    expect(prefValue(prefs, 'missing')).toBeUndefined()
  })

  it('ignores preferences with a different name', () => {
    expect(prefValue(prefs, 'export_decimal')).toBe('0')
  })
})

describe('prefBool', () => {
  it('parses a "true" string as true', () => {
    expect(prefBool(prefs, 'daily_stats', false)).toBe(true)
  })

  it('parses a "0" string as false', () => {
    expect(prefBool(prefs, 'export_decimal', true)).toBe(false)
  })

  it('uses the fallback when the preference is absent', () => {
    expect(prefBool(prefs, 'missing', true)).toBe(true)
    expect(prefBool(prefs, 'missing', false)).toBe(false)
  })
})
