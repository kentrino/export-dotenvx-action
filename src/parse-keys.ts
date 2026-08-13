export type KeySelection =
  | { type: 'all' }
  | { type: 'named'; names: string[] }

export function parseKeys(input: string): KeySelection {
  const names = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  if (names.length === 0) {
    throw new Error('input "keys" is required; use "*" to expand all keys')
  }

  if (names.includes('*')) {
    if (names.length !== 1) {
      throw new Error('input "keys" cannot mix "*" with named keys')
    }
    return { type: 'all' }
  }

  return { type: 'named', names }
}
