import { FormEvent, useState } from "react";

interface RepositoryFormProps {
  onSubmitUrl: (repoUrl: string) => Promise<void>;
  onSubmitZip: (file: File) => Promise<void>;
  loading: boolean;
}

export function RepositoryForm({ onSubmitUrl, onSubmitZip, loading }: RepositoryFormProps) {
  const [mode, setMode] = useState<"url" | "zip">("url");
  const [repoUrl, setRepoUrl] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "url") {
      await onSubmitUrl(repoUrl.trim());
      return;
    }

    if (zipFile) {
      await onSubmitZip(zipFile);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-2xl p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`rounded-lg px-4 py-2 text-sm ${mode === "url" ? "bg-accent/80 text-white" : "bg-panel text-ink/80"}`}
        >
          URL Ingestion
        </button>
        <button
          type="button"
          onClick={() => setMode("zip")}
          className={`rounded-lg px-4 py-2 text-sm ${mode === "zip" ? "bg-accent/80 text-white" : "bg-panel text-ink/80"}`}
        >
          ZIP Upload
        </button>
      </div>

      {mode === "url" ? (
        <>
          <label htmlFor="repo-url" className="mb-2 block text-sm font-semibold uppercase tracking-wide text-ink/70">
            GitHub or GitLab Repository URL
          </label>
          <input
            id="repo-url"
            type="url"
            required
            placeholder="https://github.com/org/repo or https://gitlab.com/group/project"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-ink outline-none ring-accent transition focus:ring-2"
          />
        </>
      ) : (
        <>
          <label htmlFor="repo-zip" className="mb-2 block text-sm font-semibold uppercase tracking-wide text-ink/70">
            Upload Repository ZIP
          </label>
          <input
            id="repo-zip"
            type="file"
            accept=".zip"
            required
            onChange={(event) => setZipFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-ink outline-none"
          />
        </>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading || (mode === "url" ? !repoUrl : !zipFile)}
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Analyze Repository"}
        </button>
      </div>
    </form>
  );
}
