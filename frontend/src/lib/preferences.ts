import type { UserPreference } from '@/lib/api'

/** Returns the value for a preference name, or `undefined` if absent. */
export function prefValue(
  preferences: UserPreference[],
  name: string
): string | null | undefined {
  return preferences.find((p) => p.name === name)?.value
}

/** Maps a boolean-valued preference to a boolean, defaulting when absent. */
export function prefBool(
  preferences: UserPreference[],
  name: string,
  fallback: boolean
): boolean {
  const raw = prefValue(preferences, name)
  if (raw === undefined || raw === null) return fallback
  return raw === 'true' || raw === '1'
}
