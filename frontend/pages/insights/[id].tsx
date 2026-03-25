import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { InsightsPanel } from "../../components/InsightsPanel";
import { getInsights, getSummary } from "../../lib/api";
import type { GraphInsights } from "@repo-nebula/shared";

export default function InsightsPage() {
  const router = useRouter();
  const repositoryId = typeof router.query.id === "string" ? router.query.id : "";

  const [insights, setInsights] = useState<GraphInsights | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!repositoryId) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("repo-nebula:lastRepoId", repositoryId);
    }

    async function loadInsights() {
      try {
        setLoading(true);
        const [insightsResponse, summaryResponse] = await Promise.all([
          getInsights(repositoryId),
          getSummary(repositoryId)
        ]);
        setInsights(insightsResponse);
        setSummary(summaryResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load insights");
      } finally {
        setLoading(false);
      }
    }

    void loadInsights();
  }, [repositoryId]);

  if (loading) {
    return <main className="mx-auto max-w-6xl px-6 py-16">Loading insights...</main>;
  }

  if (!insights) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p>{errorMessage ?? "Insights are unavailable. Run analysis first."}</p>
        <Link href={`/repository/${repositoryId}`} className="mt-4 inline-block text-sm underline">
          Back to repository dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold glow-text">Architecture Insights</h1>
        <Link href={`/repository/${repositoryId}`} className="text-sm font-medium underline">
          Back to repository dashboard
        </Link>
      </div>

      <InsightsPanel insights={insights} summary={summary} />
    </main>
  );
}
