import * as core from "@actions/core";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { exportEnvs } from "./export-envs.js";
import { parseEnv } from "./parse-env.js";
import { parseKeys } from "./parse-keys.js";

export async function run(): Promise<void> {
  try {
    const privateKey = core.getInput("private_key", { required: true });
    const file = core.getInput("file", { required: true });
    const keysInput = core.getInput("keys", { required: true });

    const selection = parseKeys(keysInput);
    const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
    const filePath = path.resolve(workspace, file);

    let source: string;
    try {
      source = await readFile(filePath, "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        throw new Error(`env file not found: ${filePath}`);
      }
      throw error;
    }

    const exported = exportEnvs(parseEnv(source), selection, privateKey);

    for (const [name, value] of Object.entries(exported)) {
      if (value.length > 0) {
        core.setSecret(value);
      }
      core.setOutput(name, value);
      core.exportVariable(name, value);
    }

    core.info(`exported ${Object.keys(exported).length} key(s) from ${file}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}
