import { BuildOptions, Loader } from "esbuild";

export interface EscOptions {
  target?: BuildOptions["target"];
  format?: BuildOptions["format"];
  outDir?: string;
  outFile?: string;
  bundle?: boolean;
  minify?: boolean;
  sourceMap?: BuildOptions["sourcemap"];
  declaration?: boolean;
  declarationDir?: string;
  loader?: { [ext: string]: Loader | { type?: Loader; bundle?: boolean } };
  write?: BuildOptions["write"];
  metafile?: BuildOptions["metafile"];
}
