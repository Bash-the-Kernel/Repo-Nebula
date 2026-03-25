import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GraphCanvas } from "../../components/GraphCanvas";
import { getGraph } from "../../lib/api";
import type { ArchitectureGraph } from "@repo-nebula/shared";

export default function ViewerPage() {
  const router = useRouter();
  const repositoryId = typeof router.query.id === "string" ? router.query.id : "";

  const [graph, setGraph] = useState<ArchitectureGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!repositoryId) {
      return;
    }

    async function loadGraph() {
      try {
        setLoading(true);
        const response = await getGraph(repositoryId);
        setGraph(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load graph");
      } finally {
        setLoading(false);
      }
    }

    void loadGraph();
  }, [repositoryId]);

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
        <h1 className="font-display text-3xl font-bold">Architecture Viewer</h1>
        <Link href={`/repository/${repositoryId}`} className="text-sm font-medium underline">
          Back to repository dashboard
        </Link>
      </div>

      <GraphCanvas graph={graph} />
    </main>
  );
}
