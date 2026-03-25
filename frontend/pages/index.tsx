import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { RepositoryForm } from "../components/RepositoryForm";
import { submitRepository, uploadRepositoryZip } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function navigateToRepository(repositoryId: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("repo-nebula:lastRepoId", repositoryId);
    }
    await router.push(`/repository/${repositoryId}`);
  }

  async function handleRepositorySubmit(repoUrl: string) {
    try {
      setLoading(true);
      setErrorMessage(null);
      const repository = await submitRepository(repoUrl);
      await navigateToRepository(repository.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not submit repository URL.");
    } finally {
      setLoading(false);
    }
  }

  async function handleZipSubmit(file: File) {
    try {
      setLoading(true);
      setErrorMessage(null);
      const repository = await uploadRepositoryZip(file);
      await navigateToRepository(repository.id);
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
          <p className="font-display text-sm uppercase tracking-[0.3em] text-glow">Repo Nebula</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-tight glow-text">
            Map Your Codebase As a Living Dependency Galaxy
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-ink/80">
            Ingest GitHub, GitLab, or ZIP repositories and explore architecture in a 3D nebula with layered
            dependency intelligence.
          </p>
        </header>

        <RepositoryForm loading={loading} onSubmitUrl={handleRepositorySubmit} onSubmitZip={handleZipSubmit} />

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-500/60 bg-red-950/50 px-4 py-3 text-sm text-red-100">{errorMessage}</p>
        ) : null}
      </main>
    </>
  );
}
