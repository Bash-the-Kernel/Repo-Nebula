import type { ArchitectureGraph, GraphInsights } from "@repo-nebula/shared";
import { analyzeJavaScriptRepository } from "../analysis/javascriptAnalyzer";
import { RepositoryRecord, repositoryStore } from "../models/repositoryStore";

function buildInsights(graph: ArchitectureGraph): GraphInsights {
  const outboundCount = new Map<string, number>();
  const inboundCount = new Map<string, number>();
  const importEdges = graph.edges.filter((edge) => edge.type === "import");
  const importLookup = new Set(importEdges.map((edge) => `${edge.source}=>${edge.target}`));

  for (const node of graph.nodes) {
    outboundCount.set(node.id, 0);
    inboundCount.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    outboundCount.set(edge.source, (outboundCount.get(edge.source) ?? 0) + 1);
    inboundCount.set(edge.target, (inboundCount.get(edge.target) ?? 0) + 1);
  }

  const largestModules = Array.from(outboundCount.entries())
    .filter(([id]) => !id.startsWith("folder:"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, outboundDependencies]) => ({ id, outboundDependencies }));

  const circularPairs: Array<{ a: string; b: string }> = [];
  const seen = new Set<string>();

  for (const edge of importEdges) {
    const reverseKey = `${edge.target}=>${edge.source}`;
    const pairKey = [edge.source, edge.target].sort().join("<->");
    if (importLookup.has(reverseKey) && !seen.has(pairKey)) {
      circularPairs.push({ a: edge.source, b: edge.target });
      seen.add(pairKey);
    }
  }

  const fileNodes = graph.nodes.filter((node) => node.type === "file");
  const unusedFiles = fileNodes
    .filter((node) => (outboundCount.get(node.id) ?? 0) === 0 && (inboundCount.get(node.id) ?? 0) === 0)
    .map((node) => node.id);

  return {
    dependencyCount: graph.edges.length,
    nodeCount: graph.nodes.length,
    largestModules,
    potentialCircularDependencies: circularPairs,
    unusedFiles
  };
}

function generateSummary(repositoryName: string, insights: GraphInsights): string {
  return [
    `Repository ${repositoryName} has ${insights.nodeCount} nodes and ${insights.dependencyCount} dependency edges.`,
    `Top modules by outbound dependencies: ${insights.largestModules.map((module) => module.id).join(", ") || "none"}.`,
    `Potential circular dependencies detected: ${insights.potentialCircularDependencies.length}.`,
    `Unused files detected: ${insights.unusedFiles.length}.`
  ].join(" ");
}

export async function analyzeRepository(repository: RepositoryRecord) {
  repositoryStore.upsertRepository({
    ...repository,
    status: "analyzing",
    updatedAt: new Date().toISOString(),
    error: undefined
  });

  try {
    const graph = analyzeJavaScriptRepository(repository.localPath);
    const insights = buildInsights(graph);
    const summary = generateSummary(repository.name, insights);

    repositoryStore.upsertAnalysisResult({
      repositoryId: repository.id,
      graph,
      insights,
      summary,
      analyzedAt: new Date().toISOString()
    });

    repositoryStore.upsertRepository({
      ...repository,
      status: "analyzed",
      updatedAt: new Date().toISOString(),
      error: undefined
    });

    return { graph, insights, summary };
  } catch (error) {
    repositoryStore.upsertRepository({
      ...repository,
      status: "failed",
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown analysis error"
    });
    throw error;
  }
}
