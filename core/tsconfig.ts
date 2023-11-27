import fs from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import typescript from "typescript";
import { ParseConfigHost } from "../utils/ParseConfigHost.js";

const { parseJsonConfigFileContent, parseConfigFileTextToJson } = typescript;

export async function loadTsConfigFromFile(path: string) {
  const source = parseConfigFileTextToJson(
    path,
    await fs.readFile(path, "utf-8")
  );

  if (source.error) {
    throw source.error;
  }

  const basePath = resolve(dirname(path));

  const parsed = parseJsonConfigFileContent(
    source.config,
    new ParseConfigHost(basePath),
    basePath
  );

  return parsed;
}
