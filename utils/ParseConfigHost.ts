import path, { join } from "node:path";
import fs from "node:fs";
import type {
  ParseConfigHost as IParseConfigHost,
  ModuleResolutionHost as IModuleResolutionHost,
} from "typescript";
import { isWindows } from "./isWindows.js";
import { minimatch } from "minimatch";
import { glob } from "glob";

export class ModuleResolutionHost implements IModuleResolutionHost {
  constructor(public basePath: string) {}

  fileExists(fileName: string): boolean {
    if (!path.isAbsolute(fileName)) {
      fileName = path.join(this.basePath, fileName);
    }

    return fs.existsSync(fileName);
  }

  readFile(fileName: string): string | undefined {
    if (!path.isAbsolute(fileName)) {
      fileName = path.join(this.basePath, fileName);
    }

    try {
      return fs.readFileSync(fileName, "utf-8");
    } catch {
      return undefined;
    }
  }
}

export class ParseConfigHost
  extends ModuleResolutionHost
  implements IParseConfigHost
{
  constructor(
    basePath: string,
    public useCaseSensitiveFileNames: boolean = isWindows()
  ) {
    super(basePath);
  }

  readDirectory(
    rootDir: string,
    extensions: readonly string[] | undefined,
    excludes: readonly string[] | undefined,
    includes: readonly string[],
    depth: number | undefined = Infinity
  ): readonly string[] {
    if (!path.isAbsolute(rootDir)) {
      rootDir = path.join(this.basePath, rootDir);
    }

    includes = includes.map((x) =>
      x.replace(/^(?:\.[\/\\])+/, "").replace(/[\/\\]+$/, "")
    );

    if (excludes) {
      excludes = excludes.map((x) =>
        x.replace(/^(?:\.[\/\\])+/, "").replace(/[\/\\]+$/, "")
      );

      excludes = [...excludes, "node_modules/**/*"];
    }
    const res = glob.sync([...includes], {
      absolute: true,
      cwd: this.basePath,
      maxDepth: depth,
      nodir: true,
      ignore: {
        ignored: (p) => {
          return (
            extensions !== undefined &&
            !extensions.some((x) => p.name.endsWith(x))
          );
        },
        childrenIgnored: (p) => {
          const relativePath = path.relative(this.basePath, p.fullpath());

          return (excludes ?? []).some((pattern) =>
            minimatch(relativePath, pattern)
          );
        },
      },
    });
    return res;
  }
}
