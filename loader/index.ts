import { register } from "module";
import { pathToFileURL } from "url";
import { loadTsConfigFromFile } from "../core/tsconfig.js";
import { ParseConfigHost } from "../utils/ParseConfigHost.js";
import { EscBuilder, createBuilderOption } from "../core/builder.js";
import { resolve } from "path";

register("./hook.js", import.meta.url);
