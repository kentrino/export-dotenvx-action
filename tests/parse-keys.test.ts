import { describe, expect, it } from "vite-plus/test";
import { parseKeys } from "../src/parse-keys.js";

describe("parseKeys", () => {
  it("parses newline-separated names", () => {
    expect(parseKeys("HELLO\nPLAIN")).toEqual({
      type: "named",
      names: ["HELLO", "PLAIN"],
    });
  });

  it("trims names and ignores blank lines and comments", () => {
    expect(
      parseKeys(`
        # secrets to export
        HELLO

        PLAIN
      `),
    ).toEqual({
      type: "named",
      names: ["HELLO", "PLAIN"],
    });
  });

  it("parses CRLF-separated names", () => {
    expect(parseKeys("HELLO\r\nPLAIN")).toEqual({
      type: "named",
      names: ["HELLO", "PLAIN"],
    });
  });

  it("treats * as export-all", () => {
    expect(parseKeys("*")).toEqual({ type: "all" });
    expect(parseKeys("  *  \n")).toEqual({ type: "all" });
  });

  it("rejects mixing * with named keys", () => {
    expect(() => parseKeys("*\nHELLO")).toThrowError('input "keys" cannot mix "*" with named keys');
    expect(() => parseKeys("HELLO\n*")).toThrowError('input "keys" cannot mix "*" with named keys');
  });

  it("requires at least one key", () => {
    const message = 'input "keys" is required; use "*" to export all keys';
    expect(() => parseKeys("")).toThrowError(message);
    expect(() => parseKeys("   \n# comment only\n")).toThrowError(message);
  });
});
