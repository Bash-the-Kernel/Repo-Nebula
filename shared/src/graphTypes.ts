export type GraphNodeType = "folder" | "file" | "class" | "function" | "module";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export type GraphEdgeType = "import" | "call" | "depends-on";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  metadata?: Record<string, unknown>;
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphInsights {
  dependencyCount: number;
  nodeCount: number;
  largestModules: Array<{ id: string; outboundDependencies: number }>;
  potentialCircularDependencies: Array<{ a: string; b: string }>;
  unusedFiles: string[];
}
