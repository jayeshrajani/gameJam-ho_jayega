import { describe, expect, it } from 'vitest'
import { countCharacters, NAME_MAX_CHARS, validatePlayerName } from '../src/app/playerName'

describe('validatePlayerName', () => {
  it('trims surrounding whitespace and collapses inner runs', () => {
    expect(validatePlayerName('   Jayesh   Rajani  ')).toEqual({ ok: true, name: 'Jayesh Rajani' })
  })

  it('rejects blank and whitespace-only names', () => {
    expect(validatePlayerName('').ok).toBe(false)
    expect(validatePlayerName('   \t\n  ').ok).toBe(false)
    expect(validatePlayerName('\u00A0\u3000').ok).toBe(false)
  })

  it('accepts one character', () => {
    expect(validatePlayerName('J')).toEqual({ ok: true, name: 'J' })
  })

  it('accepts Hindi and other Unicode names', () => {
    expect(validatePlayerName('जयेश')).toEqual({ ok: true, name: 'जयेश' })
    expect(validatePlayerName('श्रीकृष्ण')).toMatchObject({ ok: true })
    expect(validatePlayerName('Zoë Ōkubo')).toMatchObject({ ok: true })
    expect(validatePlayerName('محمد')).toMatchObject({ ok: true })
    expect(validatePlayerName('李小龍')).toMatchObject({ ok: true })
  })

  it('counts graphemes, not UTF-16 units', () => {
    expect(countCharacters('जयेश')).toBe(3)
    const longHindi = 'क्ष'.repeat(NAME_MAX_CHARS)
    expect(longHindi.length).toBeGreaterThan(NAME_MAX_CHARS)
    expect(validatePlayerName(longHindi).ok).toBe(true)
  })

  it('enforces the 24-character maximum', () => {
    expect(validatePlayerName('a'.repeat(NAME_MAX_CHARS)).ok).toBe(true)
    expect(validatePlayerName('a'.repeat(NAME_MAX_CHARS + 1)).ok).toBe(false)
  })

  it('keeps HTML-like text verbatim (rendering escapes it)', () => {
    expect(validatePlayerName('<b>Ustad</b>')).toEqual({ ok: true, name: '<b>Ustad</b>' })
  })

  it('rejects control characters and bidi overrides', () => {
    expect(validatePlayerName('Ja\u0000yesh').ok).toBe(false)
    expect(validatePlayerName('\u202Ehsey').ok).toBe(false)
  })
})
