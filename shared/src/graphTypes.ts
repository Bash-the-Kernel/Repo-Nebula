export type SupportedLanguage = "javascript" | "typescript" | "python" | "java" | "cpp" | "go" | "rust" | "unknown";

export type GraphNodeType = "repository" | "folder" | "file" | "module" | "class" | "function";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  language?: SupportedLanguage;
  size?: number;
  cluster?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export type GraphEdgeType = "import" | "call" | "inheritance" | "composition";

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
  metadata?: {
    repositoryId?: string;
    repositoryName?: string;
    languages?: SupportedLanguage[];
    generatedAt?: string;
  };
}

export interface GraphInsights {
  dependencyCount: number;
  nodeCount: number;
  architectureSummary: string;
  largestModules: Array<{ id: string; outboundDependencies: number }>;
  dependencyHotspots: Array<{ id: string; inboundDependencies: number }>;
  potentialCircularDependencies: Array<{ a: string; b: string }>;
  unusedFiles: string[];
  complexityHints: string[];
}
