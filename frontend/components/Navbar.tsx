import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export function Navbar() {
  const router = useRouter();
  const [lastRepositoryId, setLastRepositoryId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setLastRepositoryId(window.localStorage.getItem("repo-nebula:lastRepoId") ?? "");
  }, [router.asPath]);

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-bold glow-text">
          AI Codebase Visualizer
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-ink/80 transition hover:text-glow">
            Home
          </Link>
          {lastRepositoryId ? (
            <>
              <Link href={`/repository/${lastRepositoryId}`} className="text-ink/80 transition hover:text-glow">
                Dashboard
              </Link>
              <Link href={`/viewer/${lastRepositoryId}`} className="text-ink/80 transition hover:text-glow">
                Visualization
              </Link>
              <Link href={`/insights/${lastRepositoryId}`} className="text-ink/80 transition hover:text-glow">
                Insights
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
