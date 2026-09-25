export const NAME_MIN_CHARS = 1
export const NAME_MAX_CHARS = 24
/** Hard cap on raw UTF-16 input length; the real limit is counted in graphemes. */
export const NAME_INPUT_MAX_LENGTH = 96

export type NameValidation =
  | { ok: true; name: string }
  | { ok: false; error: string }

// Control characters and bidi overrides; ZWJ/ZWNJ stay allowed because Devanagari needs them.
const FORBIDDEN = /[\p{Cc}\u202A-\u202E\u2066-\u2069]/u

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null

/** Counts user-perceived characters, so "जयेश" counts as 3, not 4 code points. */
export function countCharacters(text: string): number {
  if (segmenter) return Array.from(segmenter.segment(text)).length
  return Array.from(text).length
}

export function normalizePlayerName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/gu, ' ').trim()
}

export function validatePlayerName(raw: string): NameValidation {
  const name = normalizePlayerName(raw)
  if (name.length === 0) {
    return { ok: false, error: 'Naam toh likho! Please enter a name — a nickname works too.' }
  }
  if (FORBIDDEN.test(name)) {
    return { ok: false, error: 'That name contains hidden control characters. Please type it again.' }
  }
  const count = countCharacters(name)
  if (count < NAME_MIN_CHARS) {
    return { ok: false, error: 'Please enter a name.' }
  }
  if (count > NAME_MAX_CHARS) {
    return {
      ok: false,
      error: `Thoda chhota karo — keep it to ${NAME_MAX_CHARS} characters (currently ${count}).`,
    }
  }
  return { ok: true, name }
}
