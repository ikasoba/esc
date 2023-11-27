import ts from "typescript";

export function getTargetName(target?: ts.ScriptTarget) {
  if (target == null || target == ts.ScriptTarget.Latest) return "esnext";

  return ts.ScriptTarget[target]?.toLowerCase() ?? "esnext";
}
