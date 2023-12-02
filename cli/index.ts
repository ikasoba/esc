#! /usr/bin/env node

import { Command } from "commander";

import pkg from "../package.json" assert { type: "json" };
import {
  EscBuilder,
  createBuilderOption,
  loadTsConfigFromFile,
} from "../core/index.js";
import { EscOptions } from "../core/option.js";
import { ParseConfigHost } from "../utils/ParseConfigHost.js";

const app = new Command()
  .name("esc")
  .version(pkg.version)
  .description(pkg.description);

app
  .command("build")
  .description("build project.")
  .option("--target <target>", "doc: https://esbuild.github.io/api/#target")
  .option("--format <format>", "iife | cjs | esm")
  .option(
    "--sourceMap <mode>",
    `true | false | linked | inline | external | both`,
    (x) => (x === "true" ? true : x === "false" ? false : x)
  )
  .option("--outDir <dir>")
  .option("--outFile <file>")
  .option("--bundle")
  .option("--minify")
  .option("--bundleJsonModule")
  .option("--declaration")
  .option("--declarationDir <dir>")
  .action(async (opts: EscOptions) => {
    const parsed = await loadTsConfigFromFile("./tsconfig.json");
    const parseConfigHost = new ParseConfigHost(".");

    const entryPoints = [
      ...parseConfigHost.readDirectory(
        ".",
        [".js", ".ts", ".jsx", ".tsx", ".html"],
        parsed.raw.exclude,
        parsed.raw.include
      ),
    ];

    const options = createBuilderOption(entryPoints, parsed);

    options.escOptions = { ...options.escOptions, ...opts };

    const builder = new EscBuilder(options);

    const result = await builder.build();

    if (result.result.errors.length) {
      for (const message of result.result.errors) {
        console.error(message);
      }
    }

    if (result.result.warnings.length) {
      for (const message of result.result.warnings) {
        console.warn(message);
      }
    }

    if (result.tscfailed) {
      process.stderr.write(Buffer.concat(result.tscOutputs!));
    }
  });

app.parse();
