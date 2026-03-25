import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GraphCanvas } from "../../components/GraphCanvas";
import { getGraph } from "../../lib/api";
import type { ArchitectureGraph } from "@repo-nebula/shared";

const allNodeTypes = ["repository", "folder", "file", "module", "class", "function"] as const;
const allEdgeTypes = ["import", "call", "inheritance", "composition"] as const;

export default function ViewerPage() {
  const router = useRouter();
  const repositoryId = typeof router.query.id === "string" ? router.query.id : "";

  const [graph, setGraph] = useState<ArchitectureGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [depth, setDepth] = useState(5);
  const [maxNodes, setMaxNodes] = useState(1200);
  const [nodeTypes, setNodeTypes] = useState<string[]>([...allNodeTypes]);
  const [edgeTypes, setEdgeTypes] = useState<string[]>([...allEdgeTypes]);

  useEffect(() => {
    if (!repositoryId) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("repo-nebula:lastRepoId", repositoryId);
    }

    async function loadGraph() {
      try {
        setLoading(true);
        const response = await getGraph(repositoryId, {
          depth,
          maxNodes,
          nodeTypes: nodeTypes as never,
          edgeTypes: edgeTypes as never
        });
        setGraph(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load graph");
      } finally {
        setLoading(false);
      }
    }

    void loadGraph();
  }, [repositoryId, depth, maxNodes, nodeTypes, edgeTypes]);

  function toggleValue(currentValues: string[], value: string, allValues: readonly string[]): string[] {
    if (currentValues.includes(value)) {
      const next = currentValues.filter((item) => item !== value);
      return next.length === 0 ? [...allValues] : next;
    }
    return [...currentValues, value];
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-6 py-16">Loading graph...</main>;
  }

  if (!graph) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p>{errorMessage ?? "Graph is unavailable. Run analysis first."}</p>
        <Link href={`/repository/${repositoryId}`} className="mt-4 inline-block text-sm underline">
          Back to repository dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold glow-text">Architecture Nebula Viewer</h1>
        <Link href={`/repository/${repositoryId}`} className="text-sm font-medium underline">
          Back to repository dashboard
        </Link>
      </div>

      <section className="surface mb-5 grid gap-4 rounded-2xl p-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-2 block text-ink/70">Dependency Depth: {depth}</span>
          <input type="range" min={1} max={8} value={depth} onChange={(event) => setDepth(Number(event.target.value))} className="w-full" />
        </label>

        <label className="text-sm">
          <span className="mb-2 block text-ink/70">Max Nodes: {maxNodes}</span>
          <input
            type="range"
            min={300}
            max={2500}
            step={100}
            value={maxNodes}
            onChange={(event) => setMaxNodes(Number(event.target.value))}
            className="w-full"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm text-ink/70">Node Types</span>
          <div className="flex flex-wrap gap-2">
            {allNodeTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNodeTypes((current) => toggleValue(current, type, allNodeTypes))}
                className={`rounded-md px-2 py-1 text-xs ${nodeTypes.includes(type) ? "bg-accent text-white" : "bg-panel border border-line"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm text-ink/70">Edge Types</span>
          <div className="flex flex-wrap gap-2">
            {allEdgeTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEdgeTypes((current) => toggleValue(current, type, allEdgeTypes))}
                className={`rounded-md px-2 py-1 text-xs ${edgeTypes.includes(type) ? "bg-glow/90 text-canvas" : "bg-panel border border-line"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      <GraphCanvas graph={graph} autoCenter centerPadding={120} viewportCenterBiasPx={{ x: -10, y: 6 }} />
    </main>
  );
}
