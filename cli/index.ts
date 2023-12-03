#! /usr/bin/env node

import { Command } from "commander";
import { watch } from "yosano";

import pkg from "../package.json" assert { type: "json" };
import {
  EscBuilder,
  createBuilderOption,
  loadTsConfigFromFile,
} from "../core/index.js";
import { EscOptions } from "../core/option.js";
import { ParseConfigHost } from "../utils/ParseConfigHost.js";
import path from "path";
import { resourceUsage } from "process";
import { minimatch } from "minimatch";

const build = async (root: string, opts: EscOptions = {}) => {
  const parsed = await loadTsConfigFromFile(path.join(root, "./tsconfig.json"));
  const parseConfigHost = new ParseConfigHost(root);

  const entryPoints = [
    ...parseConfigHost.readDirectory(
      root,
      undefined,
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

  return { options, include: parsed.raw.include as string[] | undefined };
};

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
  .option("--declaration [bool]", "default: true", (opt) =>
    opt === "true" ? true : opt === "false" ? false : true
  )
  .option("--declarationDir <dir>")
  .action(async (opts: EscOptions) => {
    await build(".", opts);
  });

app.command("watch").action(async () => {
  console.log("\x1b[2J");
  let { options, include } = await build(".", {
    declaration: false,
  });

  let count = 1;

  for await (const event of watch("**/*", { root: "." })) {
    if (
      (options.escOptions.outDir &&
        event.path.startsWith(options.escOptions.outDir)) ||
      include?.every((pattern) => !minimatch(event.path, pattern))
    )
      continue;
    console.log(
      `\x1b[2J\x1b[94mrebuilding for the ${(count += 1)}th time...\x1b[0m`
    );

    try {
      ({ options, include } = await build(".", {
        declaration: false,
      }));
    } catch (err) {
      console.error(err);
    }
  }
});

app.parse();
