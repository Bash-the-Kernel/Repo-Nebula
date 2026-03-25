import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getRepository, RepositoryDto, triggerAnalysis } from "../../lib/api";

export default function RepositoryDashboardPage() {
  const router = useRouter();
  const repositoryId = typeof router.query.id === "string" ? router.query.id : "";

  const [repository, setRepository] = useState<RepositoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!repositoryId) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("repo-nebula:lastRepoId", repositoryId);
    }

    async function loadRepository() {
      try {
        setLoading(true);
        const response = await getRepository(repositoryId);
        setRepository(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to fetch repository");
      } finally {
        setLoading(false);
      }
    }

    void loadRepository();
  }, [repositoryId]);

  async function runAnalysis() {
    if (!repositoryId) {
      return;
    }

    try {
      setAnalyzing(true);
      setErrorMessage(null);
      await triggerAnalysis(repositoryId);
      const updated = await getRepository(repositoryId);
      setRepository(updated);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-6 py-16">Loading repository...</main>;
  }

  if (!repository) {
    return <main className="mx-auto max-w-5xl px-6 py-16">Repository not found.</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-4xl font-bold glow-text">{repository.name}</h1>
        <p className="mt-2 text-sm text-ink/70">Status: {repository.status}</p>
        <p className="mt-1 text-sm text-ink/70">Source type: {repository.sourceType}</p>
        <p className="mt-1 text-sm text-ink/70">Source: {repository.repoUrl}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(repository.detectedLanguages.length > 0 ? repository.detectedLanguages : ["pending"]).map((language) => (
            <span key={language} className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-wide text-ink/70">
              {language}
            </span>
          ))}
        </div>

        {repository.error ? <p className="mt-3 text-sm text-red-300">Last error: {repository.error}</p> : null}
        {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>

          <Link className="rounded-xl border border-line bg-panel px-5 py-3 text-sm font-semibold" href={`/viewer/${repository.id}`}>
            Open Architecture Viewer
          </Link>

          <Link className="rounded-xl border border-line bg-panel px-5 py-3 text-sm font-semibold" href={`/insights/${repository.id}`}>
            Open Insights
          </Link>
        </div>
      </section>
    </main>
  );
}
