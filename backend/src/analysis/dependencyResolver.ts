import path from "path";
import type { ParsedEntity } from "./parsers/types";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function resolveDependency(
  importerFilePath: string,
  dependency: string,
  sourceRoot: string,
  fileIndexByRelative: Set<string>
): string | null {
  if (!dependency) {
    return null;
  }

  if (!dependency.startsWith(".") && !dependency.startsWith("/")) {
    return `module:${dependency.split(/[\\/]/)[0]}`;
  }

  const importerAbsolute = path.resolve(sourceRoot, importerFilePath);
  const importerDir = path.dirname(importerAbsolute);
  const basePath = path.resolve(importerDir, dependency);

  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.py`,
    `${basePath}.java`,
    `${basePath}.cpp`,
    `${basePath}.cc`,
    `${basePath}.cxx`,
    `${basePath}.h`,
    `${basePath}.hpp`,
    `${basePath}.go`,
    `${basePath}.rs`,
    path.join(basePath, "index.js"),
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "__init__.py")
  ];

  for (const candidate of candidates) {
    const relative = normalizePath(path.relative(sourceRoot, candidate));
    if (fileIndexByRelative.has(relative)) {
      return relative;
    }
  }

  return null;
}

export function buildFunctionLookup(entities: ParsedEntity[]): Map<string, string[]> {
  const lookup = new Map<string, string[]>();
  for (const entity of entities) {
    for (const fn of entity.functions) {
      const key = fn.name.toLowerCase();
      const list = lookup.get(key) ?? [];
      list.push(`${entity.filePath}::${fn.name}`);
      lookup.set(key, list);
    }
  }
  return lookup;
}
