import path from "node:path";
import ts from "typescript";
import esbuild, { BuildOptions, TsconfigRaw } from "esbuild";
import { getTargetName } from "./utils.js";
import { Command } from "../utils/Command.js";
import { EscPlugin } from "./EscPlugin.js";
import { EscOptions } from "./option.js";

export interface BuilderOption {
  entryPoints: string[];
  tsconfigRaw: TsconfigRaw;
  escOptions: EscOptions;
}

export interface BuilderResult {
  result: esbuild.BuildResult;
  tscfailed: boolean;
  tscOutputs: Buffer[];
}

export const createBuilderOption = (
  entryPoints: string[] | null,
  o: ts.ParsedCommandLine
): BuilderOption => {
  const option: BuilderOption = {
    escOptions: {
      target: getTargetName(o.options.target),
      bundle: !!o.options.outFile,
      outFile: o.options.outFile,
      outDir: o.options.outDir,
      declaration: o.options.declaration,
      declarationDir: o.options.declarationDir,
      format: "esm",
      write: !o.options.noEmit,
    },
    entryPoints: entryPoints ?? o.fileNames,
    tsconfigRaw: o.raw,
  };

  switch (o.options.module) {
    case ts.ModuleKind.CommonJS: {
      option.escOptions.format = "cjs";
      break;
    }

    case undefined:
    case ts.ModuleKind.ES2015:
    case ts.ModuleKind.ES2020:
    case ts.ModuleKind.ES2022:
    case ts.ModuleKind.ESNext:
    case ts.ModuleKind.Node16:
    case ts.ModuleKind.NodeNext: {
      option.escOptions.format = "esm";
      break;
    }

    default: {
      console.warn(
        "Unsupported module type",
        JSON.stringify(ts.ModuleKind[o.options.module!])
      );

      break;
    }
  }

  option.escOptions = { ...option.escOptions, ...o.raw?.escOptions };

  return option;
};

export class EscBuilder {
  constructor(public option: BuilderOption) {}

  createBuildOptions() {
    const option: BuildOptions = {
      target: this.option.escOptions.target,
      entryPoints: this.option.entryPoints,
      minify: this.option.escOptions.minify,
      logLevel: "info",
      plugins: [EscPlugin(this.option.escOptions)],
      format: this.option.escOptions.format,
      bundle: true,
      supported: {
        "import-assertions": true,
      },
      sourcemap: this.option.escOptions.sourceMap,
      loader: {
        ...this.option.escOptions.loader,
      },
      write: this.option.escOptions.write,
      metafile: this.option.escOptions.metafile,
    };

    if (this.option.escOptions.bundle) {
      option.outfile = this.option.escOptions.outFile ?? "index.js";
    } else {
      option.outdir = path.resolve(this.option.escOptions.outDir ?? ".");
    }

    return option;
  }

  async build(): Promise<BuilderResult> {
    const buildOptions = this.createBuildOptions();

    let tscTask: ReturnType<Command["statusWithOutput"]> | null = null;
    const buildTask = esbuild.build(buildOptions);

    buildTask.then((result) => {
      result.errors;
    });

    if (this.option.escOptions.declaration) {
      const args = [
        "tsc",
        "--declaration",
        "--emitDeclarationOnly",
        "true",
        "--noEmitOnError",
        "false",
      ];

      args.push(
        "--declarationDir",
        this.option.escOptions.declarationDir ??
          this.option.escOptions.outDir ??
          "."
      );

      tscTask = new Command({
        cmd: "npx",
        args: args,
      })
        .spawn()
        .statusWithOutput();
    }

    return await Promise.all([buildTask, tscTask]).then(([result, tsc]) => {
      return {
        result: result,
        tscfailed: !tsc?.[0]?.ok,
        tscOutputs: tsc?.[1] ?? [],
      };
    });
  }
}
