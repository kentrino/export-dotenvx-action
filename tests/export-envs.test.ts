import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { DecryptError } from "../src/decrypt.js";
import { exportEnvs } from "../src/export-envs.js";
import { parseEnv } from "../src/parse-env.js";

const fixturePrivateKey = "dc08409876f6c2da7e5123380b071b131977ffbf2aadb78945e1579514dbae4b";

const parsedFixture = parseEnv(
  readFileSync(path.join(import.meta.dirname, "../fixtures/.env.ci"), "utf8"),
);

describe("exportEnvs", () => {
  it("decrypts named keys and leaves plaintext alone", () => {
    expect(
      exportEnvs(parsedFixture, { type: "named", names: ["HELLO", "PLAIN"] }, fixturePrivateKey),
    ).toEqual({
      HELLO: "hello-from-ci",
      PLAIN: "visible",
    });
  });

  it("exports all keys except DOTENV_PUBLIC_KEY*", () => {
    expect(exportEnvs(parsedFixture, { type: "all" }, fixturePrivateKey)).toEqual({
      HELLO: "hello-from-ci",
      EXTRA: "should-not-leak",
      PLAIN: "visible",
    });
  });

  it("skips both DOTENV_PUBLIC_KEY and DOTENV_PUBLIC_KEY_*", () => {
    const parsed = {
      DOTENV_PUBLIC_KEY: "pub",
      DOTENV_PUBLIC_KEY_CI: "pub-ci",
      DOTENV_PUBLIC_KEY_PRODUCTION: "pub-prod",
      HELLO: "plain",
    };

    expect(exportEnvs(parsed, { type: "all" }, fixturePrivateKey)).toEqual({
      HELLO: "plain",
    });
  });

  it("throws when named keys are missing from the env file", () => {
    expect(() =>
      exportEnvs(parsedFixture, { type: "named", names: ["HELLO", "MISSING"] }, fixturePrivateKey),
    ).toThrowError("keys not found in env file: MISSING");
  });

  it("throws when there are no keys to export", () => {
    expect(() => exportEnvs({}, { type: "all" }, fixturePrivateKey)).toThrowError(
      "env file contains no keys to export",
    );

    expect(() =>
      exportEnvs({ DOTENV_PUBLIC_KEY_CI: "pub" }, { type: "all" }, fixturePrivateKey),
    ).toThrowError("env file contains no keys to export");

    expect(() =>
      exportEnvs(parsedFixture, { type: "named", names: [] }, fixturePrivateKey),
    ).toThrowError("env file contains no keys to export");
  });

  it("propagates decrypt failures for named encrypted keys", () => {
    expect(() =>
      exportEnvs(parsedFixture, { type: "named", names: ["HELLO"] }, "invalid-private-key"),
    ).toThrow(DecryptError);
  });
});
