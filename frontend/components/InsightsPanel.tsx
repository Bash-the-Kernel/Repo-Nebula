import type { GraphInsights } from "@repo-nebula/shared";

interface InsightsPanelProps {
  insights: GraphInsights;
  summary: string;
}

export function InsightsPanel({ insights, summary }: InsightsPanelProps) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-6">
      <h2 className="font-display text-xl font-bold">Architecture Insights</h2>
      <p className="mt-2 text-sm text-ink/80">{summary}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Overview</h3>
          <p className="mt-2 text-sm">Dependencies: {insights.dependencyCount}</p>
          <p className="text-sm">Nodes: {insights.nodeCount}</p>
        </div>
        <div className="rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Warnings</h3>
          <p className="mt-2 text-sm">Circular dependencies: {insights.potentialCircularDependencies.length}</p>
          <p className="text-sm">Unused files: {insights.unusedFiles.length}</p>
        </div>
      </div>
    </section>
  );
}
