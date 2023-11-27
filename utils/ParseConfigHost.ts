import path, { join } from "node:path";
import fs from "node:fs";
import type {
  ParseConfigHost as IParseConfigHost,
  ModuleResolutionHost as IModuleResolutionHost,
} from "typescript";
import { isWindows } from "./isWindows.js";
import { minimatch } from "minimatch";

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
    extensions: readonly string[],
    excludes: readonly string[] | undefined,
    includes: readonly string[],
    depth: number | undefined = Infinity
  ): readonly string[] {
    if (!path.isAbsolute(rootDir)) {
      rootDir = path.join(this.basePath, rootDir);
    }

    if (excludes) {
      excludes = excludes.map((x) =>
        x.replace(/^(?:\.[\/\\])+/, "").replace(/[\/\\]+$/, "")
      );

      excludes = [...excludes, "node_modules/**/*"];
    }

    const pathStack = [rootDir];
    let depthCount = 0;
    const list: string[] = [];

    while (pathStack.length && depthCount < depth) {
      const currentPath = pathStack.pop()!;
      const dir = fs.readdirSync(currentPath, { withFileTypes: true });

      let isExistsChildDir = false;
      for (const item of dir) {
        const fullPath = path.join(item.path, item.name);
        const itemPath = path.relative(
          this.basePath,
          path.join(item.path, item.name)
        );

        if (item.isFile() && !extensions.some((x) => itemPath.endsWith(x)))
          continue;
        if (
          excludes &&
          excludes.some((pattern) => minimatch(itemPath, pattern))
        )
          continue;
        if (!includes.some((pattern) => minimatch(itemPath, pattern))) continue;

        if (item.isDirectory()) {
          pathStack.push(fullPath);

          isExistsChildDir = true;
        }

        if (item.isFile()) {
          list.push(itemPath);
        }
      }

      if (isExistsChildDir) {
        depthCount += 1;
      }
    }

    return list;
  }
}
