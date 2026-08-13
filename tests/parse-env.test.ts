import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseEnv } from '../src/parse-env.js'

// Cases ported from motdotla/dotenv tests/test-parse.js (BSD-2-Clause).
const dotenvCorpus = readFileSync(
  path.join(import.meta.dirname, 'fixtures/dotenv.env'),
  'utf8',
)

describe('parseEnv', () => {
  describe('dotenv tests/.env corpus', () => {
    const parsed = parseEnv(dotenvCorpus)

    it('returns an object', () => {
      expect(parsed).toBeTypeOf('object')
    })

    it('sets basic environment variable', () => {
      expect(parsed.BASIC).toBe('basic')
    })

    it('reads after a skipped line', () => {
      expect(parsed.AFTER_LINE).toBe('after_line')
    })

    it('defaults empty values to empty string', () => {
      expect(parsed.EMPTY).toBe('')
      expect(parsed.EMPTY_SINGLE_QUOTES).toBe('')
      expect(parsed.EMPTY_DOUBLE_QUOTES).toBe('')
      expect(parsed.EMPTY_BACKTICKS).toBe('')
    })

    it('escapes single quoted values', () => {
      expect(parsed.SINGLE_QUOTES).toBe('single_quotes')
    })

    it('respects surrounding spaces in single quotes', () => {
      expect(parsed.SINGLE_QUOTES_SPACED).toBe(' single quotes ')
    })

    it('escapes double quoted values', () => {
      expect(parsed.DOUBLE_QUOTES).toBe('double_quotes')
    })

    it('respects surrounding spaces in double quotes', () => {
      expect(parsed.DOUBLE_QUOTES_SPACED).toBe(' double quotes ')
    })

    it('respects double quotes inside single quotes', () => {
      expect(parsed.DOUBLE_QUOTES_INSIDE_SINGLE).toBe(
        'double "quotes" work inside single quotes',
      )
    })

    it('respects spacing for badly formed brackets', () => {
      expect(parsed.DOUBLE_QUOTES_WITH_NO_SPACE_BRACKET).toBe(
        '{ port: $MONGOLAB_PORT}',
      )
    })

    it('respects single quotes inside double quotes', () => {
      expect(parsed.SINGLE_QUOTES_INSIDE_DOUBLE).toBe(
        "single 'quotes' work inside double quotes",
      )
    })

    it('respects backticks inside single quotes', () => {
      expect(parsed.BACKTICKS_INSIDE_SINGLE).toBe(
        '`backticks` work inside single quotes',
      )
    })

    it('respects backticks inside double quotes', () => {
      expect(parsed.BACKTICKS_INSIDE_DOUBLE).toBe(
        '`backticks` work inside double quotes',
      )
    })

    it('parses backtick-quoted values', () => {
      expect(parsed.BACKTICKS).toBe('backticks')
      expect(parsed.BACKTICKS_SPACED).toBe(' backticks ')
    })

    it('respects quotes inside backticks', () => {
      expect(parsed.DOUBLE_QUOTES_INSIDE_BACKTICKS).toBe(
        'double "quotes" work inside backticks',
      )
      expect(parsed.SINGLE_QUOTES_INSIDE_BACKTICKS).toBe(
        "single 'quotes' work inside backticks",
      )
      expect(parsed.DOUBLE_AND_SINGLE_QUOTES_INSIDE_BACKTICKS).toBe(
        `double "quotes" and single 'quotes' work inside backticks`,
      )
    })

    it('expands newlines but only if double quoted', () => {
      expect(parsed.EXPAND_NEWLINES).toBe('expand\nnew\nlines')
      expect(parsed.DONT_EXPAND_UNQUOTED).toBe('dontexpand\\nnewlines')
      expect(parsed.DONT_EXPAND_SQUOTED).toBe('dontexpand\\nnewlines')
    })

    it('ignores commented lines', () => {
      expect(parsed.COMMENTS).toBeUndefined()
    })

    it('ignores inline comments', () => {
      expect(parsed.INLINE_COMMENTS).toBe('inline comments')
    })

    it('respects # inside quotes and treats unquoted # as a comment', () => {
      expect(parsed.INLINE_COMMENTS_SINGLE_QUOTES).toBe(
        'inline comments outside of #singlequotes',
      )
      expect(parsed.INLINE_COMMENTS_DOUBLE_QUOTES).toBe(
        'inline comments outside of #doublequotes',
      )
      expect(parsed.INLINE_COMMENTS_BACKTICKS).toBe(
        'inline comments outside of #backticks',
      )
      expect(parsed.INLINE_COMMENTS_SPACE).toBe('inline comments start with a')
    })

    it('respects equals signs in values', () => {
      expect(parsed.EQUAL_SIGNS).toBe('equals==')
    })

    it('retains inner quotes', () => {
      expect(parsed.RETAIN_INNER_QUOTES).toBe('{"foo": "bar"}')
      expect(parsed.RETAIN_INNER_QUOTES_AS_STRING).toBe('{"foo": "bar"}')
      expect(parsed.RETAIN_INNER_QUOTES_AS_BACKTICKS).toBe(`{"foo": "bar's"}`)
    })

    it('trims spaces from unquoted values', () => {
      expect(parsed.TRIM_SPACE_FROM_UNQUOTED).toBe('some spaced out string')
    })

    it('parses email addresses completely', () => {
      expect(parsed.USERNAME).toBe('therealnerdybeast@example.tld')
    })

    it('parses keys and values surrounded by spaces', () => {
      expect(parsed.SPACED_KEY).toBe('parsed')
    })

    it('ignores the export keyword', () => {
      expect(parsed.EXPORT_IS_DECLARED).toBe('parsed')
      expect(parsed.EXPORT_IS_DECLARED_WITH_SPACING).toBe('parsed')
      expect(parsed.EXPORT_IS_DECLARED_WITH_SOME_VALUE).toBe('some_value')
      expect(parsed.EXPORT_IS_DECLARED_WITH_SOME_VALUE_SPACED).toBe('some_value')
      expect(parsed.EXPORT_IS_DECLARED_WITH_SOME_VALUE_AND_SPACING).toBe(
        'some_value',
      )
    })
  })

  it('last duplicate key wins', () => {
    expect(parseEnv('DUP=one\nDUP=two')).toEqual({ DUP: 'two' })
  })

  it.each([
    ['\\r', 'SERVER=localhost\rPASSWORD=password\rDB=tests\r'],
    ['\\n', 'SERVER=localhost\nPASSWORD=password\nDB=tests\n'],
    ['\\r\\n', 'SERVER=localhost\r\nPASSWORD=password\r\nDB=tests\r\n'],
  ] as const)('parses (%s) line endings', (_label, src) => {
    expect(parseEnv(src)).toEqual({
      SERVER: 'localhost',
      PASSWORD: 'password',
      DB: 'tests',
    })
  })

  it('parses YAML-style KEY: value separators', () => {
    expect(parseEnv('PORT: 8080\nHOST: localhost')).toEqual({
      PORT: '8080',
      HOST: 'localhost',
    })
  })

  it('returns an empty object for comments and blank lines', () => {
    expect(parseEnv('# only a comment\n\n  \n# another')).toEqual({})
  })

  it('keeps encrypted dotenvx values as ciphertext', () => {
    const src = [
      'DOTENV_PUBLIC_KEY_CI="03bb88e0228a761e9943d7f046bf46070191f78ed54916dd55bf71d7e4b2d51952"',
      'HELLO="encrypted:BAYWjJwfnTlMz3OX+Og+2RxlrIBlTHy3ORziC1GKXwLMiStEe4oLwQfnen3UjRxRHtExuix5wveYPH1p2X2CstxC0Aq23/mo9tHSoJ+Q1bbzsDjs3Tw6OAdChBUYd8hIGOjjO9YUMjvKp8x9KLU="',
      'PLAIN="visible"',
    ].join('\n')

    const parsed = parseEnv(src)
    expect(parsed.DOTENV_PUBLIC_KEY_CI).toBe(
      '03bb88e0228a761e9943d7f046bf46070191f78ed54916dd55bf71d7e4b2d51952',
    )
    expect(parsed.HELLO?.startsWith('encrypted:')).toBe(true)
    expect(parsed.PLAIN).toBe('visible')
  })
})
