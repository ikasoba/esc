import fs from "node:fs/promises";
import path, { extname } from "node:path";
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
            for (const ext in option.loader) {
              const loader = option.loader[ext];

              if (extname(args.path) === ext && typeof loader === "object") {
                return {
                  external: !loader.bundle,
                };
              }
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
