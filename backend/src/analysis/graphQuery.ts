import type { ArchitectureGraph, GraphEdgeType, GraphNodeType } from "@repo-nebula/shared";

export interface GraphQueryOptions {
  nodeTypes?: GraphNodeType[];
  edgeTypes?: GraphEdgeType[];
  maxDepth?: number;
  maxNodes?: number;
  focusNodeId?: string;
}

export function queryGraph(graph: ArchitectureGraph, options: GraphQueryOptions): ArchitectureGraph {
  const allowedNodeTypes = new Set(options.nodeTypes ?? graph.nodes.map((node) => node.type));
  const allowedEdgeTypes = new Set(options.edgeTypes ?? graph.edges.map((edge) => edge.type));
  const maxDepth = Math.max(1, options.maxDepth ?? 5);
  const maxNodes = Math.max(100, options.maxNodes ?? 1600);

  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (!allowedEdgeTypes.has(edge.type)) {
      continue;
    }
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const root = options.focusNodeId && byId.has(options.focusNodeId)
    ? options.focusNodeId
    : graph.nodes.find((node) => node.type === "repository")?.id ?? graph.nodes[0]?.id;

  if (!root) {
    return graph;
  }

  const kept = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: root, depth: 0 }];

  while (queue.length > 0 && kept.size < maxNodes) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (kept.has(current.id) || current.depth > maxDepth) {
      continue;
    }

    const node = byId.get(current.id);
    if (!node || !allowedNodeTypes.has(node.type)) {
      continue;
    }

    kept.add(current.id);

    for (const next of adjacency.get(current.id) ?? []) {
      queue.push({ id: next, depth: current.depth + 1 });
    }
  }

  const nodes = graph.nodes.filter((node) => kept.has(node.id));
  const edges = graph.edges.filter(
    (edge) =>
      kept.has(edge.source) &&
      kept.has(edge.target) &&
      allowedEdgeTypes.has(edge.type)
  );

  return {
    ...graph,
    nodes,
    edges
  };
}
