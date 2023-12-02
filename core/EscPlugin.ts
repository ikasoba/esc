import fs from "node:fs/promises";
import path from "node:path";
import { Plugin, PluginBuild } from "esbuild";
import { EscOptions } from "./option.js";

export function EscPlugin(option: EscOptions): Plugin {
  return {
    name: "EscPlugin",

    setup(build: PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args) => {
        switch (args.kind) {
          case "entry-point": {
            return;
          }

          default: {
            if (!option.bundle && /\.json$/i.test(args.path)) {
              if (option.bundleJsonModule) {
                return { external: false };
              }

              const filePath = path.join(args.resolveDir, args.path);
              const outFilePath = path.join(
                build.initialOptions.outdir ?? ".",
                path.relative(".", path.join(args.resolveDir, args.path))
              );

              await fs.mkdir(path.dirname(outFilePath)).catch((e) => {});

              await fs.copyFile(filePath, outFilePath);
            }
          }
        }

        return {
          external: !option.bundle,
        };
      });
    },
  };
}
