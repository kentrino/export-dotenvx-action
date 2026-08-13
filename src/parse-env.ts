// Ported from motdotla/dotenv `parseRegex` (lib/main.js).
// Copyright (c) 2015, Scott Motte. All rights reserved.
// SPDX-License-Identifier: BSD-2-Clause
// Full license text: THIRD_PARTY_NOTICES.md

const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm

export function parseEnv(src: string): Record<string, string> {
  const parsed: Record<string, string> = {}
  const lines = src.replace(/\r\n?/g, '\n')
  const pattern = new RegExp(LINE.source, LINE.flags)

  let match: RegExpExecArray | null
  while ((match = pattern.exec(lines)) != null) {
    const key = match[1]
    if (key === undefined) {
      continue
    }

    let value = (match[2] ?? '').trim()
    const quote = value[0]
    value = value.replace(/^(['"`])([\s\S]*)\1$/, '$2')
    if (quote === '"') {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    }
    parsed[key] = value
  }

  return parsed
}
