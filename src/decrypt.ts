import { Buffer } from "node:buffer";
import { decrypt as decryptEcies } from "eciesjs";

const PREFIX = "encrypted:" as const;

export type EncryptedValue = `${typeof PREFIX}${string}`;

export type DecryptErrorCode =
  | "MISSING_PRIVATE_KEY"
  | "INVALID_PRIVATE_KEY"
  | "WRONG_PRIVATE_KEY"
  | "MALFORMED_ENCRYPTED_DATA"
  | "DECRYPTION_FAILED";

export class DecryptError extends Error {
  readonly code: DecryptErrorCode;

  constructor(code: DecryptErrorCode, message: string, options?: { cause?: unknown }) {
    super(`[${code}] ${message}`, options);
    this.name = "DecryptError";
    this.code = code;
  }
}

export function isEncrypted(value: string): value is EncryptedValue {
  return value.startsWith(PREFIX);
}

function privateKeysFrom(privateKey: string): string[] {
  return privateKey
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function classifyDecryptError(error: unknown): DecryptError {
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  if (message === "Invalid private key" || message.startsWith("hex string expected")) {
    return new DecryptError("INVALID_PRIVATE_KEY", "could not decrypt using private key", {
      cause,
    });
  }

  if (message === "Unsupported state or unable to authenticate data") {
    return new DecryptError("WRONG_PRIVATE_KEY", "could not decrypt using private key", { cause });
  }

  if (
    message === "second arg must be public key" ||
    message.startsWith("bad point:") ||
    message.includes("was invalid. Expected 33 compressed bytes")
  ) {
    return new DecryptError("MALFORMED_ENCRYPTED_DATA", "could not decrypt using private key", {
      cause,
    });
  }

  return new DecryptError("DECRYPTION_FAILED", message, { cause });
}

export function decrypt(value: EncryptedValue, privateKey: string): string {
  if (!isEncrypted(value)) {
    return value;
  }

  const privateKeys = privateKeysFrom(privateKey);
  if (privateKeys.length === 0) {
    throw new DecryptError(
      "MISSING_PRIVATE_KEY",
      "could not decrypt because private key is missing",
    );
  }

  const ciphertext = Buffer.from(value.slice(PREFIX.length), "base64");
  let lastError: DecryptError | undefined;

  for (const key of privateKeys) {
    try {
      return Buffer.from(decryptEcies(Buffer.from(key, "hex"), ciphertext)).toString("utf8");
    } catch (error) {
      lastError = classifyDecryptError(error);
    }
  }

  throw lastError ?? new DecryptError("DECRYPTION_FAILED", "could not decrypt using private key");
}
