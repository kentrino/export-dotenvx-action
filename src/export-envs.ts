import { decrypt, isEncrypted } from "./decrypt.js";
import type { KeySelection } from "./parse-keys.js";

function isDotenvPublicKey(name: string): boolean {
  return name === "DOTENV_PUBLIC_KEY" || name.startsWith("DOTENV_PUBLIC_KEY_");
}

export function exportEnvs(
  parsed: Record<string, string>,
  selection: KeySelection,
  privateKey: string,
): Record<string, string> {
  const names =
    selection.type === "all"
      ? Object.keys(parsed).filter((name) => !isDotenvPublicKey(name))
      : selection.names;

  if (names.length === 0) {
    throw new Error("env file contains no keys to export");
  }

  if (selection.type === "named") {
    const missing = names.filter((name) => !(name in parsed));
    if (missing.length > 0) {
      throw new Error(`keys not found in env file: ${missing.join(", ")}`);
    }
  }

  const exported: Record<string, string> = {};
  for (const name of names) {
    const raw = parsed[name] ?? "";
    exported[name] = isEncrypted(raw) ? decrypt(raw, privateKey) : raw;
  }
  return exported;
}
