import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { encrypt } from 'eciesjs'
import { describe, expect, it } from 'vitest'
import {
  DecryptError,
  decrypt,
  isEncrypted,
  type EncryptedValue,
} from '../src/decrypt.js'
import { parseEnv } from '../src/parse-env.js'

// Keypair and cases ported from dotenvx tests/lib/helpers/decryptKeyValue.test.js.
const publicKey =
  '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498'
const privateKey =
  '1fc1cafa954a7a2bf0a6fbff46189c9e03e3a66b4d1133108ab9fcdb9e154b70'
const wrongPrivateKey =
  '9c1ab41477004e68066129a8866887d316ba5d7177593dbc5e3026d6f64d32f8'

const fixturePrivateKey =
  'dc08409876f6c2da7e5123380b071b131977ffbf2aadb78945e1579514dbae4b'

function encryptValue(value: string, receiverPublicKey = publicKey): EncryptedValue {
  const ciphertext = encrypt(receiverPublicKey, Buffer.from(value))
  return `encrypted:${Buffer.from(ciphertext).toString('base64')}`
}

function expectDecryptError(
  fn: () => unknown,
  code: DecryptError['code'],
): DecryptError {
  try {
    fn()
    throw new Error(`expected ${code} but decrypt succeeded`)
  } catch (error) {
    expect(error).toBeInstanceOf(DecryptError)
    const decryptError = error as DecryptError
    expect(decryptError.code).toBe(code)
    expect(decryptError.message).toContain(`[${code}]`)
    return decryptError
  }
}

describe('isEncrypted', () => {
  it('detects the encrypted: prefix', () => {
    expect(isEncrypted('encrypted:abc')).toBe(true)
    expect(isEncrypted('encrypted:')).toBe(true)
  })

  it('is case-sensitive and requires the prefix at the start', () => {
    expect(isEncrypted('ENCRYPTED:abc')).toBe(false)
    expect(isEncrypted(' encrypted:abc')).toBe(false)
    expect(isEncrypted('world')).toBe(false)
  })
})

describe('decrypt', () => {
  it('decrypts a value encrypted for the matching public key', () => {
    const encryptedString = encryptValue('hello')
    expect(decrypt(encryptedString, privateKey)).toBe('hello')
  })

  it('returns the raw value when it does not start with encrypted:', () => {
    expect(decrypt('world' as EncryptedValue, privateKey)).toBe('world')
  })

  it('decrypts an empty string ciphertext', () => {
    expect(decrypt(encryptValue(''), privateKey)).toBe('')
  })

  it('decrypts implicit and explicit newlines', () => {
    const implicit = `line 1
line 2
line 3`
    expect(decrypt(encryptValue(implicit), privateKey)).toBe(implicit)
    expect(decrypt(encryptValue('line 1\nline 2\nline 3'), privateKey)).toBe(
      'line 1\nline 2\nline 3',
    )
  })

  it('decrypts the hardcoded dotenvx ciphertext', () => {
    expect(
      decrypt(
        'encrypted:BMVCQpz/+NYDcGZhbXyqbwP8IDJSTXl4xDQsgusQHEVFAWOXQnKRBTOzRiwuYIJzjuWnKkrQJEDEi8Av9xnfx61jVTJymVWLjVmFK7CM+6lmKOnIhPMzu0Mi0dH82P81bOXjkZTHIIcA',
        privateKey,
      ),
    ).toBe('expanded')
  })

  it('decrypts @dotenvx/primitives sample vectors', () => {
    expect(
      decrypt(
        'encrypted:BC6dAYLyWtegG6SE44mf5KFegS2Wx9nhmlHhmGki0N0TV3XDpSN4Lfpz1p/pYdIlD+8rmsLTUNyDABJsGADuoDsv8caHK8yifvRly8cN2Uz9kRWATHsg6eaJ3vNSUFrzqYfs3tcsT1w=',
        'bc0abbb65ae0929b0b492035c57bd742527ad5cc0bb4f28155b62ac8c41324c8',
      ),
    ).toBe('Dotenvx')

    expect(
      decrypt(
        'encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l',
        'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c',
      ),
    ).toBe('World')
  })

  it('decrypts the CI fixture values', () => {
    const parsed = parseEnv(
      readFileSync(
        path.join(import.meta.dirname, '../fixtures/.env.ci'),
        'utf8',
      ),
    )

    expect(decrypt(parsed.HELLO as EncryptedValue, fixturePrivateKey)).toBe(
      'hello-from-ci',
    )
    expect(decrypt(parsed.EXTRA as EncryptedValue, fixturePrivateKey)).toBe(
      'should-not-leak',
    )
    expect(decrypt(parsed.PLAIN as EncryptedValue, fixturePrivateKey)).toBe(
      'visible',
    )
  })

  it('throws MISSING_PRIVATE_KEY when the private key is empty', () => {
    const encryptedString = encryptValue('hello')
    expectDecryptError(() => decrypt(encryptedString, ''), 'MISSING_PRIVATE_KEY')
    expectDecryptError(() => decrypt(encryptedString, '   '), 'MISSING_PRIVATE_KEY')
    expectDecryptError(
      () => decrypt(encryptedString, '\n,\t'),
      'MISSING_PRIVATE_KEY',
    )
  })

  it('throws INVALID_PRIVATE_KEY for a non-hex key', () => {
    expectDecryptError(
      () => decrypt(encryptValue('hello'), 'invalid-private-key'),
      'INVALID_PRIVATE_KEY',
    )
  })

  it('throws WRONG_PRIVATE_KEY when the key does not match', () => {
    expectDecryptError(
      () => decrypt(encryptValue('hello'), wrongPrivateKey),
      'WRONG_PRIVATE_KEY',
    )
  })

  it('throws MALFORMED_ENCRYPTED_DATA for truncated ciphertext', () => {
    expectDecryptError(
      () => decrypt('encrypted:1234', privateKey),
      'MALFORMED_ENCRYPTED_DATA',
    )
    expectDecryptError(
      () => decrypt('encrypted:', privateKey),
      'MALFORMED_ENCRYPTED_DATA',
    )
  })

  it('throws MALFORMED_ENCRYPTED_DATA for dotenvx malformed ciphertext', () => {
    expectDecryptError(
      () =>
        decrypt(
          'encrypted:ADJIvD6DxJdTcFdg1tcasYa9G1O5YVtFJs0yJgem+aGIlRJl9N1Fbq6kdPtIwfS0c6VJF4EN6H+D0JUwJ4FmoerQi0XQ4mv4AyA73KjrxVEqmSypg2InsV0e4WxdP5Qx/jVVSgxD',
          privateKey,
        ),
      'MALFORMED_ENCRYPTED_DATA',
    )
  })

  it('tries comma-separated private keys until one works', () => {
    const encryptedString = encryptValue('hello')
    expect(
      decrypt(encryptedString, `${wrongPrivateKey},${privateKey}`),
    ).toBe('hello')
    expect(
      decrypt(encryptedString, `  ${wrongPrivateKey} , ${privateKey} \n`),
    ).toBe('hello')
  })

  it('trims whitespace around a single private key', () => {
    expect(decrypt(encryptValue('hello'), `  ${privateKey}\n`)).toBe('hello')
  })
})
