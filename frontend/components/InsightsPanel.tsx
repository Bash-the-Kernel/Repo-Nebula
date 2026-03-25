import type { GraphInsights } from "@repo-nebula/shared";

interface InsightsPanelProps {
  insights: GraphInsights;
  summary: string;
}

export function InsightsPanel({ insights, summary }: InsightsPanelProps) {
  return (
    <section className="surface rounded-2xl p-6">
      <h2 className="font-display text-xl font-bold glow-text">Architecture Insights</h2>
      <p className="mt-2 text-sm text-ink/80">{summary}</p>
      <p className="mt-1 text-sm text-ink/70">{insights.architectureSummary}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel/50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Overview</h3>
          <p className="mt-2 text-sm">Dependencies: {insights.dependencyCount}</p>
          <p className="text-sm">Nodes: {insights.nodeCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel/50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Warnings</h3>
          <p className="mt-2 text-sm">Circular dependencies: {insights.potentialCircularDependencies.length}</p>
          <p className="text-sm">Unused files: {insights.unusedFiles.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel/50 p-4 md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Dependency Hotspots</h3>
          <p className="mt-2 text-sm text-ink/80">
            {insights.dependencyHotspots.map((item) => `${item.id} (${item.inboundDependencies})`).join(" | ") || "None"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panel/50 p-4 md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Complexity Hints</h3>
          <p className="mt-2 text-sm text-ink/80">{insights.complexityHints.join(" ") || "No major complexity issues detected."}</p>
        </div>
      </div>
    </section>
  );
}
