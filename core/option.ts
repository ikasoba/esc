import { BuildOptions } from "esbuild";

export interface EscOptions {
  target?: BuildOptions["target"];
  format?: BuildOptions["format"];
  outDir?: string;
  outFile?: string;
  bundle?: boolean;
  bundleJsonModule?: boolean;
  minify?: boolean;
  sourceMap?: BuildOptions["sourcemap"];
  declaration?: boolean;
  declarationDir?: string;
}
