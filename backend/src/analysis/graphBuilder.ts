import path from "path";
import type { ArchitectureGraph, GraphEdge, GraphNode, SupportedLanguage } from "@repo-nebula/shared";
import { buildFunctionLookup, resolveDependency } from "./dependencyResolver";
import type { ParsedEntity } from "./parsers/types";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function createFolderNodes(filePath: string, nodes: Map<string, GraphNode>) {
  const parts = filePath.split("/").slice(0, -1);
  let cumulative = "";
  for (const part of parts) {
    cumulative = cumulative ? `${cumulative}/${part}` : part;
    const id = `folder:${cumulative}`;
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        type: "folder",
        label: part,
        path: cumulative,
        cluster: cumulative.split("/")[0] ?? "root"
      });
    }
  }
}

export function buildArchitectureGraph(params: {
  repositoryId: string;
  repositoryName: string;
  sourceRoot: string;
  entities: ParsedEntity[];
  languages: SupportedLanguage[];
}): ArchitectureGraph {
  const { repositoryId, repositoryName, sourceRoot, entities, languages } = params;

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const repositoryNodeId = `repo:${repositoryId}`;
  nodes.set(repositoryNodeId, {
    id: repositoryNodeId,
    type: "repository",
    label: repositoryName,
    language: "unknown",
    size: entities.length,
    cluster: "root"
  });

  const fileIndexByRelative = new Set(entities.map((entity) => entity.filePath));
  const functionLookup = buildFunctionLookup(entities);

  for (const entity of entities) {
    createFolderNodes(entity.filePath, nodes);
    const basename = path.basename(entity.filePath);
    const fileCluster = entity.filePath.split("/")[0] ?? "root";

    nodes.set(entity.filePath, {
      id: entity.filePath,
      type: "file",
      label: basename,
      language: entity.language,
      size: entity.lineCount,
      path: entity.filePath,
      cluster: fileCluster
    });

    const compositionId = `composition:${repositoryNodeId}->${entity.filePath}`;
    edges.set(compositionId, {
      id: compositionId,
      source: repositoryNodeId,
      target: entity.filePath,
      type: "composition"
    });

    for (const cls of entity.classes) {
      const classId = `${entity.filePath}::class:${cls.name}`;
      nodes.set(classId, {
        id: classId,
        type: "class",
        label: cls.name,
        language: entity.language,
        cluster: fileCluster,
        path: entity.filePath
      });

      edges.set(`composition:${entity.filePath}->${classId}`, {
        id: `composition:${entity.filePath}->${classId}`,
        source: entity.filePath,
        target: classId,
        type: "composition"
      });

      if (cls.extends) {
        const target = `${entity.filePath}::class:${cls.extends}`;
        if (nodes.has(target)) {
          edges.set(`inheritance:${classId}->${target}`, {
            id: `inheritance:${classId}->${target}`,
            source: classId,
            target,
            type: "inheritance"
          });
        }
      }
    }

    for (const fn of entity.functions) {
      const functionId = `${entity.filePath}::fn:${fn.name}`;
      nodes.set(functionId, {
        id: functionId,
        type: "function",
        label: fn.name,
        language: entity.language,
        cluster: fileCluster,
        path: entity.filePath
      });

      edges.set(`composition:${entity.filePath}->${functionId}`, {
        id: `composition:${entity.filePath}->${functionId}`,
        source: entity.filePath,
        target: functionId,
        type: "composition"
      });

      for (const called of fn.calls) {
        const candidates = functionLookup.get(called.toLowerCase()) ?? [];
        for (const candidate of candidates.slice(0, 3)) {
          const candidateFile = candidate.split("::")[0];
          const targetId = `${candidateFile}::fn:${called}`;
          if (targetId === functionId) {
            continue;
          }
          if (nodes.has(targetId)) {
            const edgeId = `call:${functionId}->${targetId}`;
            edges.set(edgeId, {
              id: edgeId,
              source: functionId,
              target: targetId,
              type: "call"
            });
          }
        }
      }
    }

    for (const imported of entity.imports) {
      const resolved = resolveDependency(entity.filePath, imported, sourceRoot, fileIndexByRelative);
      if (!resolved) {
        continue;
      }

      if (resolved.startsWith("module:")) {
        if (!nodes.has(resolved)) {
          nodes.set(resolved, {
            id: resolved,
            type: "module",
            label: resolved.replace("module:", ""),
            language: "unknown",
            cluster: "external"
          });
        }
      }

      const edgeId = `import:${entity.filePath}->${resolved}`;
      edges.set(edgeId, {
        id: edgeId,
        source: entity.filePath,
        target: resolved,
        type: "import"
      });
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    metadata: {
      repositoryId,
      repositoryName,
      languages,
      generatedAt: new Date().toISOString()
    }
  };
}
