import { pathToFileURL } from "url";
import {
  BuilderOption,
  EscBuilder,
  createBuilderOption,
} from "../core/builder.js";
import { loadTsConfigFromFile } from "../core/tsconfig.js";
import { ParseConfigHost } from "../utils/ParseConfigHost.js";
import path from "path";
import { InitializeHook, ResolveHook } from "module";

const map = new Map<string, string>();
let options: BuilderOption;

export const initialize: InitializeHook = async () => {
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

  options = createBuilderOption(entryPoints, parsed);

  options.escOptions.metafile = true;

  const builder = new EscBuilder(options);

  const result = await builder.build();

  const meta = result.result.metafile!;

  for (const outPath in meta.outputs) {
    const output = meta.outputs[outPath];

    if (output.entryPoint) {
      map.set(
        pathToFileURL(path.resolve(output.entryPoint)).toString(),
        pathToFileURL(path.resolve(outPath)).toString()
      );
    }
  }
};

export const resolve: ResolveHook = async (specifier, context, next) => {
  const res = map.get(new URL(specifier, context.parentURL).toString());
  if (res) {
    return {
      url: res,
      shortCircuit: true,
    };
  }

  return next(specifier, context);
};
