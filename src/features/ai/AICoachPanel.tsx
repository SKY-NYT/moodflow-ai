import { useMemo, useState } from "react";
import { SectionCard } from "../../components/SectionCard";
import { getAiReflection } from "./openai";
import type { JournalEntry } from "../../types/journal";
import { useJournalStore } from "../../store/useJournalStore";

interface AICoachPanelProps {
  entries: JournalEntry[];
  onAction?: (kind: "success" | "info" | "error", text: string) => void;
}

export function AICoachPanel({ entries, onAction }: AICoachPanelProps) {
  const aiEnabled = useJournalStore((state) => state.aiEnabled);
  const setAiEnabled = useJournalStore((state) => state.setAiEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");

  const latestTitles = useMemo(
    () =>
      entries
        .slice(0, 3)
        .map((entry) => entry.title)
        .join(", "),
    [entries],
  );

  async function handleGenerate() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await getAiReflection(entries);
      setResponse(result);
      onAction?.("success", "AI insight generated.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while generating AI support.";
      setError(message);
      onAction?.("error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="AI reflection coach"
      description="Securely generate reflection summaries through your Vercel serverless function."
      action={
        <label className="inline-flex items-center gap-2 text-sm text-(--text-muted)">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(event) => setAiEnabled(event.target.checked)}
          />
          Enable AI panel
        </label>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl border border-(--secondary) bg-(--mood-calm-soft) px-4 py-3 text-sm leading-6 text-(--text-primary)">
          Production-safe setup: the app now calls{" "}
          <span className="font-semibold">/api/reflect</span>, so your OpenAI
          key stays on the server in Vercel.
        </div>

        <div className="rounded-2xl border border-(--card-border) bg-(--bg-soft) p-4 text-sm text-(--text-muted)">
          {entries.length === 0
            ? "Add some reflections first so the AI coach has context."
            : `The coach will analyze your latest entries, including: ${latestTitles || "your recent notes"}.`}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!aiEnabled || entries.length === 0 || loading}
            onClick={handleGenerate}
            className="rounded-2xl bg-(--brand-strong) px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Generate AI insight"}
          </button>
        </div>

        {error ? (
          <p
            className="rounded-2xl border border-(--accent-pink) bg-(--accent-pink-soft) px-4 py-3 text-sm text-(--text-primary)"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {response ? (
          <article className="rounded-3xl border border-(--card-border) bg-white p-5 dark:bg-(--surface)">
            {response.split("\n").map((line, index) => (
              <p
                key={`${line}-${index}`}
                className="mb-2 text-sm leading-6 text-(--text-muted) last:mb-0"
              >
                {line}
              </p>
            ))}
          </article>
        ) : (
          <div className="rounded-3xl border border-dashed border-(--card-border) bg-(--bg-soft) px-4 py-8 text-sm text-(--text-soft)">
            AI feedback will appear here.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
