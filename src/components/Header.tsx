import { useEffect, useState } from "preact/hooks";
import { formatMonth } from "../format";
import { isStale } from "../lib/freshness";

interface Props {
  lastMonth: string;
  frameworkCount: number;
}

const repoUrl = "https://github.com/thanks2music/heatcheck";

export function Header({ lastMonth, frameworkCount }: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const stale = isStale(lastMonth, new Date());

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = setTimeout(() => setCopyState("idle"), 1500);
    return () => clearTimeout(timer);
  }, [copyState]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <header class="header">
      <div class="title">
        <h1>
          <a href="./">heatcheck</a>
        </h1>
        <p class="subtitle">Framework Trends</p>
      </div>
      <p class="about">
        Share of new GitHub stars among {frameworkCount} frameworks · median of the last 3 months · data
        through {formatMonth(lastMonth)}
        {stale && (
          <span class="stale" title="The monthly data update may have stopped.">
            {" "}
            · may be out of date
          </span>
        )}
      </p>
      <div class="header-actions">
        <button type="button" class="button" onClick={copyLink}>
          {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy link"}
        </button>
        <a class="button" href={`${repoUrl}#how-to-read-the-chart`}>
          About
        </a>
        <a class="button" href={repoUrl} aria-label="Source on GitHub">
          GitHub
        </a>
      </div>
    </header>
  );
}
