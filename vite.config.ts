import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}": "vp check --fix",
    "*.{json,jsonc,md,mdx}": "vp fmt",
  },
  fmt: {
    ignorePatterns: ["dist/**", "coverage/**", "pnpm-lock.yaml", "THIRD_PARTY_NOTICES.md"],
    printWidth: 100,
    proseWrap: "preserve",
  },
  lint: {
    ignorePatterns: ["dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  pack: {
    entry: ["src/index.ts"],
    dts: false,
    format: ["esm"],
    platform: "node",
    sourcemap: true,
    fixedExtension: false,
    deps: {
      alwaysBundle: [/.*/],
      onlyBundle: false,
    },
  },
  run: {
    cache: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
