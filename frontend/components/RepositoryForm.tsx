import { FormEvent, useState } from "react";

interface RepositoryFormProps {
  onSubmit: (repoUrl: string) => Promise<void>;
  loading: boolean;
}

export function RepositoryForm({ onSubmit, loading }: RepositoryFormProps) {
  const [repoUrl, setRepoUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(repoUrl.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
      <label htmlFor="repo-url" className="mb-2 block text-sm font-semibold uppercase tracking-wide text-ink/70">
        GitHub Repository URL
      </label>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          id="repo-url"
          type="url"
          required
          placeholder="https://github.com/org/repo"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-accent transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading || !repoUrl}
          className="rounded-xl bg-ink px-6 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Analyze Repo"}
        </button>
      </div>
    </form>
  );
}
