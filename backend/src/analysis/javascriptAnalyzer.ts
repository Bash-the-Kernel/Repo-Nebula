import fs from "fs-extra";
import path from "path";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { globSync } from "glob";
import type { ArchitectureGraph, GraphEdge, GraphNode } from "@repo-nebula/shared";

const CODE_GLOB = "**/*.{js,jsx,ts,tsx,mjs,cjs}";
const IGNORED_PATHS = ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**", "**/.next/**"];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function resolveRelativeImport(sourceFile: string, importPath: string, fileIndex: Set<string>): string | null {
  const sourceDir = path.dirname(sourceFile);
  const basePath = path.resolve(sourceDir, importPath);
  const extensions = ["", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];

  for (const extension of extensions) {
    const candidate = normalizePath(`${basePath}${extension}`);
    if (fileIndex.has(candidate)) {
      return candidate;
    }
  }

  for (const extension of [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]) {
    const candidate = normalizePath(path.join(basePath, `index${extension}`));
    if (fileIndex.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function analyzeJavaScriptRepository(repositoryPath: string): ArchitectureGraph {
  const absoluteFiles = globSync(CODE_GLOB, {
    cwd: repositoryPath,
    absolute: true,
    nodir: true,
    ignore: IGNORED_PATHS
  }).map(normalizePath);

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const fileIndex = new Set(absoluteFiles);

  for (const absoluteFilePath of absoluteFiles) {
    const relativePath = normalizePath(path.relative(repositoryPath, absoluteFilePath));
    nodes.set(relativePath, {
      id: relativePath,
      type: "file",
      label: path.basename(relativePath),
      path: relativePath
    });

    const folderParts = relativePath.split("/").slice(0, -1);
    let runningPath = "";
    for (const part of folderParts) {
      runningPath = runningPath ? `${runningPath}/${part}` : part;
      const folderId = `folder:${runningPath}`;
      if (!nodes.has(folderId)) {
        nodes.set(folderId, {
          id: folderId,
          type: "folder",
          label: part,
          path: runningPath
        });
      }
    }

    const source = fs.readFileSync(absoluteFilePath, "utf-8");

    try {
      const ast = parse(source, {
        sourceType: "unambiguous",
        plugins: ["typescript", "jsx", "classProperties", "dynamicImport"]
      });

      traverse(ast, {
        ImportDeclaration(importPathNode: NodePath<t.ImportDeclaration>) {
          const importPath = importPathNode.node.source.value;
          if (typeof importPath !== "string") {
            return;
          }

          if (importPath.startsWith(".")) {
            const resolvedAbsolutePath = resolveRelativeImport(absoluteFilePath, importPath, fileIndex);
            if (!resolvedAbsolutePath) {
              return;
            }

            const targetId = normalizePath(path.relative(repositoryPath, resolvedAbsolutePath));
            const edgeId = `import:${relativePath}->${targetId}`;
            edges.set(edgeId, {
              id: edgeId,
              source: relativePath,
              target: targetId,
              type: "import"
            });
            return;
          }

          const packageName = importPath.startsWith("@")
            ? importPath.split("/").slice(0, 2).join("/")
            : importPath.split("/")[0];
          const moduleId = `module:${packageName}`;

          if (!nodes.has(moduleId)) {
            nodes.set(moduleId, {
              id: moduleId,
              type: "module",
              label: packageName
            });
          }

          const edgeId = `depends-on:${relativePath}->${moduleId}`;
          edges.set(edgeId, {
            id: edgeId,
            source: relativePath,
            target: moduleId,
            type: "depends-on"
          });
        },
        CallExpression(callExpressionPath: NodePath<t.CallExpression>) {
          if (callExpressionPath.node.callee.type !== "Identifier") {
            return;
          }

          if (callExpressionPath.node.callee.name !== "require") {
            return;
          }

          const [firstArg] = callExpressionPath.node.arguments;
          if (!firstArg || firstArg.type !== "StringLiteral") {
            return;
          }

          const importPath = firstArg.value;
          if (importPath.startsWith(".")) {
            const resolvedAbsolutePath = resolveRelativeImport(absoluteFilePath, importPath, fileIndex);
            if (!resolvedAbsolutePath) {
              return;
            }

            const targetId = normalizePath(path.relative(repositoryPath, resolvedAbsolutePath));
            const edgeId = `import:${relativePath}->${targetId}`;
            edges.set(edgeId, {
              id: edgeId,
              source: relativePath,
              target: targetId,
              type: "import"
            });
            return;
          }

          const packageName = importPath.startsWith("@")
            ? importPath.split("/").slice(0, 2).join("/")
            : importPath.split("/")[0];
          const moduleId = `module:${packageName}`;

          if (!nodes.has(moduleId)) {
            nodes.set(moduleId, {
              id: moduleId,
              type: "module",
              label: packageName
            });
          }

          const edgeId = `depends-on:${relativePath}->${moduleId}`;
          edges.set(edgeId, {
            id: edgeId,
            source: relativePath,
            target: moduleId,
            type: "depends-on"
          });
        }
      });
    } catch {
      // Ignore parse errors in this initial version and continue with best-effort analysis.
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values())
  };
}
