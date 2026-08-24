/**
 * Locale data mirrored from Kimai's `config/locales.php`. The backend exposes
 * no API for these lists, so the option sets are hardcoded here.
 */

/** Language codes that have an active Weblate translation in Kimai. */
export const LANGUAGES = [
  ['ar', 'العربية'],
  ['bg', 'Български'],
  ['ca', 'Català'],
  ['cs', 'Čeština'],
  ['da', 'Dansk'],
  ['de', 'Deutsch'],
  ['el', 'Ελληνικά'],
  ['en', 'English'],
  ['eo', 'Esperanto'],
  ['es', 'Español'],
  ['eu', 'Euskara'],
  ['fa', 'فارسی'],
  ['fi', 'Suomi'],
  ['fo', 'Føroyskt'],
  ['fr', 'Français'],
  ['he', 'עברית'],
  ['hr', 'Hrvatski'],
  ['hu', 'Magyar'],
  ['id', 'Bahasa Indonesia'],
  ['it', 'Italiano'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['nb_NO', 'Norsk bokmål'],
  ['nl', 'Nederlands'],
  ['pa', 'ਪੰਜਾਬੀ'],
  ['pl', 'Polski'],
  ['pt', 'Português'],
  ['pt_BR', 'Português (Brasil)'],
  ['ro', 'Română'],
  ['ru', 'Русский'],
  ['sk', 'Slovenčina'],
  ['sl', 'Slovenščina'],
  ['sr', 'Српски'],
  ['sv', 'Svenska'],
  ['ta', 'தமிழ்'],
  ['tr', 'Türkçe'],
  ['uk', 'Українська'],
  ['vi', 'Tiếng Việt'],
  ['zh_CN', '中文 (简体)'],
  ['zh_Hant', '中文 (繁體)'],
] as const

/** Regional locale subset (mirrors the main regional variants in locales.php). */
export const LOCALES = [
  ['ar', 'Arabic'],
  ['cs_CZ', 'Czech (Czechia)'],
  ['da_DK', 'Danish (Denmark)'],
  ['de_AT', 'German (Austria)'],
  ['de_CH', 'German (Switzerland)'],
  ['de_DE', 'German (Germany)'],
  ['en_AU', 'English (Australia)'],
  ['en_CA', 'English (Canada)'],
  ['en_GB', 'English (UK)'],
  ['en_US', 'English (US)'],
  ['es_ES', 'Spanish (Spain)'],
  ['es_MX', 'Spanish (Mexico)'],
  ['fr_FR', 'French (France)'],
  ['fr_CA', 'French (Canada)'],
  ['he_IL', 'Hebrew (Israel)'],
  ['it_IT', 'Italian (Italy)'],
  ['ja_JP', 'Japanese (Japan)'],
  ['ko_KR', 'Korean (South Korea)'],
  ['nb_NO', 'Norwegian (Norway)'],
  ['nl_NL', 'Dutch (Netherlands)'],
  ['pl_PL', 'Polish (Poland)'],
  ['pt_BR', 'Portuguese (Brazil)'],
  ['pt_PT', 'Portuguese (Portugal)'],
  ['ru_RU', 'Russian (Russia)'],
  ['sv_SE', 'Swedish (Sweden)'],
  ['tr_TR', 'Turkish (Turkey)'],
  ['uk_UA', 'Ukrainian (Ukraine)'],
  ['vi_VN', 'Vietnamese (Vietnam)'],
  ['zh_CN', 'Chinese (Simplified)'],
] as const

/**
 * IANA timezone identifiers. Uses the runtime's list of supported values when
 * available, falling back to a curated subset for older environments.
 */
export function timezoneOptions(): string[] {
  const supportedValuesOf = (Intl as { supportedValuesOf?: (k: string) => string[] })
    .supportedValuesOf
  if (supportedValuesOf) {
    try {
      const zones = supportedValuesOf('timeZone')
      if (zones.length > 0) return zones
    } catch {
      // fall through to the curated list
    }
  }
  return [
    'Africa/Abidjan',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Asia/Dubai',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Kolkata',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Europe/Amsterdam',
    'Europe/Berlin',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Moscow',
    'Europe/Paris',
    'Europe/Rome',
    'Europe/Vienna',
    'Pacific/Auckland',
  ]
}

/** Weekday values accepted by the `first_weekday` user preference. */
export const WEEKDAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
] as const
