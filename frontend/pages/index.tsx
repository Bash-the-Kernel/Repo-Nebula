import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { RepositoryForm } from "../components/RepositoryForm";
import { submitRepository } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRepositorySubmit(repoUrl: string) {
    try {
      setLoading(true);
      setErrorMessage(null);
      const repository = await submitRepository(repoUrl);
      await router.push(`/repository/${repository.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not submit repository URL.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>AI Codebase Visualizer</title>
      </Head>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-ink/70">Repo Nebula</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-tight">
            Visualize Your Codebase Architecture in Minutes
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-ink/80">
            Submit a GitHub repository and generate interactive dependency graphs, architectural summaries,
            and static analysis insights.
          </p>
        </header>

        <RepositoryForm loading={loading} onSubmit={handleRepositorySubmit} />

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}
      </main>
    </>
  );
}
