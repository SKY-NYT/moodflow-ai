import { useEffect, useRef, useState } from "react";
import { JournalForm } from "./JournalForm";
import {
  formatDate,
  getMoodBadgeClass,
  getTagToneClass,
} from "../../lib/utils";
import type { JournalEntry } from "../../types/journal";
import { getAiReflection } from "../ai/openai";
import { useJournalStore } from "../../store/useJournalStore";

interface DetailedReflectionPageProps {
  entry: JournalEntry;
  onBack: () => void;
  onDeleteRequest: (entry: JournalEntry) => void;
  onAction?: (kind: "success" | "info" | "error", text: string) => void;
}

interface QaItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

const EMPTY_QA_HISTORY: QaItem[] = [];

export function DetailedReflectionPage({
  entry,
  onBack,
  onDeleteRequest,
  onAction,
}: DetailedReflectionPageProps) {
  const storeHydrated = useJournalStore((state) => state.hasHydrated);
  const aiReflections = useJournalStore((state) => state.aiReflections);
  const aiQaHistory = useJournalStore((state) => state.aiQaHistory);
  const setAiReflection = useJournalStore((state) => state.setAiReflection);
  const clearAiReflection = useJournalStore((state) => state.clearAiReflection);
  const setAiQaHistory = useJournalStore((state) => state.setAiQaHistory);
  const clearAiQaHistory = useJournalStore((state) => state.clearAiQaHistory);
  const savedReflection = aiReflections[entry.id] ?? null;
  const savedQaHistory = aiQaHistory[entry.id] ?? EMPTY_QA_HISTORY;
  const moodBadgeClass = getMoodBadgeClass(entry.mood);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QaItem[]>([]);
  const [editingQaId, setEditingQaId] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const aiRequestControllerRef = useRef<AbortController | null>(null);
  const qaScrollRef = useRef<HTMLDivElement | null>(null);
  const qaBottomRef = useRef<HTMLDivElement | null>(null);

  const hasAiContent = loading || Boolean(aiError) || Boolean(aiResult);

  useEffect(() => {
    if (!storeHydrated) return;

    if (!savedReflection) {
      setAiResult("");
      setAiGeneratedAt(null);
      setQaHistory([]);
      setFollowUpQuestion("");
      setEditingQaId(null);
      setFollowUpError("");
      return;
    }

    setAiResult(savedReflection.result);
    setAiGeneratedAt(savedReflection.generatedAt);
    setQaHistory(savedQaHistory);

    setFollowUpQuestion("");
    setEditingQaId(null);
    setFollowUpError("");
  }, [entry.id, savedQaHistory, savedReflection, storeHydrated]);

  useEffect(() => {
    if (!qaScrollRef.current) return;
    qaScrollRef.current.scrollTo({
      top: qaScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
    qaBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [qaHistory, followUpLoading, aiResult]);

  async function handleAiReflect() {
    const controller = new AbortController();
    aiRequestControllerRef.current = controller;

    setLoading(true);
    setAiError("");
    setAiResult("");
    setQaHistory([]);
    setAiQaHistory(entry.id, []);
    setEditingQaId(null);
    setFollowUpError("");

    try {
      const result = await getAiReflection([entry], controller.signal);
      const generatedAt = new Date().toISOString();
      setAiResult(result);
      setAiGeneratedAt(generatedAt);
      setAiReflection(entry.id, { result, generatedAt });
      onAction?.("success", "AI reflection generated for this entry.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unable to generate AI reflection for this entry.";
      setAiError(message);
      onAction?.("error", message);
    } finally {
      aiRequestControllerRef.current = null;
      setLoading(false);
    }
  }

  async function handleAskFollowUp() {
    const question = followUpQuestion.trim();
    if (!question || !aiResult || loading || followUpLoading) return;

    const controller = new AbortController();
    aiRequestControllerRef.current = controller;
    setFollowUpLoading(true);
    setFollowUpError("");

    try {
      const answer = await getAiReflection([entry], controller.signal, {
        question,
        reflection: aiResult,
      });

      if (editingQaId) {
        setQaHistory((prev) => {
          const nextHistory = prev.map((item) =>
            item.id === editingQaId
              ? {
                  ...item,
                  question,
                  answer,
                  createdAt: new Date().toISOString(),
                }
              : item,
          );
          setAiQaHistory(entry.id, nextHistory);
          return nextHistory;
        });
      } else {
        const newQa: QaItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          question,
          answer,
          createdAt: new Date().toISOString(),
        };
        setQaHistory((prev) => {
          const nextHistory = [...prev, newQa];
          setAiQaHistory(entry.id, nextHistory);
          return nextHistory;
        });
      }

      setEditingQaId(null);
      setFollowUpQuestion("");
      onAction?.("success", "AI answered your follow-up question.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unable to answer follow-up question right now.";
      setFollowUpError(message);
      onAction?.("error", message);
    } finally {
      aiRequestControllerRef.current = null;
      setFollowUpLoading(false);
    }
  }

  function handleEditPrompt(item: QaItem) {
    setEditingQaId(item.id);
    setFollowUpQuestion(item.question);
    setFollowUpError("");
  }

  return (
    <section className="mt-4 flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3">
        <button
          type="button"
          className="rounded-lg border border-(--primary) bg-(--brand-faint) px-3 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary) hover:text-white"
          onClick={onBack}
        >
          Back to journal
        </button>
      </div>

      <div className="grid flex-none gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] xl:items-start">
        <article className="rounded-2xl border border-(--card-border) bg-(--surface) p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-(--card-border) pb-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {isEditing ? "Edit reflection" : "Reflection details"}
            </h2>

            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-(--card-border) px-3 py-2 text-sm text-(--text-muted)"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-(--accent-pink) bg-(--accent-pink-soft) px-3 py-2 text-sm text-(--text-primary)"
                  onClick={() => onDeleteRequest(entry)}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>

          {isEditing ? (
            <JournalForm
              editingEntry={entry}
              onFinishEdit={() => setIsEditing(false)}
              onAction={onAction}
            />
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-(--text-primary)">
                    {entry.title}
                  </h2>
                  <p className="mt-1 text-sm text-(--text-soft)">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${moodBadgeClass}`}
                >
                  {entry.mood} · {entry.energy}/10
                </div>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-(--text-muted)">
                {entry.note}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => {
                  const toneClass = getTagToneClass(tag, index);
                  return (
                    <span
                      key={tag}
                      className={`rounded-full border px-3 py-1 text-xs ${toneClass}`}
                    >
                      #{tag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </article>

        <aside className="rounded-2xl border border-(--card-border) bg-(--surface) p-5">
          <div className="mb-4 border-b border-(--card-border) pb-3">
            <h3 className="text-lg font-semibold text-(--text-primary)">
              AI reflection for this entry
            </h3>
            <p className="mt-1 text-sm text-(--text-muted)">
              Generate focused feedback from this single reflection.
            </p>
          </div>

          <div className="grid gap-4">
            <button
              type="button"
              className="rounded-xl bg-(--primary) px-4 py-3 text-sm font-semibold text-white hover:bg-(--primary-hover) disabled:opacity-60"
              disabled={loading}
              onClick={handleAiReflect}
            >
              {loading
                ? "Generating..."
                : aiResult
                  ? "Generate again"
                  : "Reflect with AI"}
            </button>

            {aiError ? (
              <p className="rounded-xl border border-(--accent-pink) bg-(--accent-pink-soft) px-3 py-2 text-sm text-(--text-primary)">
                {aiError}
              </p>
            ) : (
              <p className="rounded-xl border border-(--card-border) bg-(--bg-soft) px-3 py-2 text-sm text-(--text-muted)">
                {loading
                  ? "AI is generating your reflection now."
                  : aiResult
                    ? "AI reflection is ready below. You can regenerate anytime."
                    : "Generate AI reflection to see an insight card below this section."}
              </p>
            )}
          </div>
        </aside>
      </div>

      {hasAiContent ? (
        <article className="mt-5 flex min-h-0 flex-1 flex-col rounded-2xl bg-white/80 p-5 ring-1 ring-(--card-border) transition hover:-translate-y-0.5 hover:ring-(--brand-soft)">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-(--text-primary)">
                MoodFlow AI
              </h3>
              <p className="mt-1 text-sm text-(--text-soft)">
                {aiGeneratedAt
                  ? formatDate(aiGeneratedAt)
                  : "Waiting for AI response..."}
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl border border-(--card-border) bg-white px-4 py-2 text-sm text-(--text-muted)"
              onClick={() => {
                aiRequestControllerRef.current?.abort();
                setAiResult("");
                setAiError("");
                setAiGeneratedAt(null);
                setFollowUpQuestion("");
                setQaHistory([]);
                setEditingQaId(null);
                setFollowUpError("");
                clearAiReflection(entry.id);
                clearAiQaHistory(entry.id);
              }}
            >
              x
            </button>
          </div>

          <div
            ref={qaScrollRef}
            className="no-scrollbar mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-(--card-border) bg-(--bg-soft) p-4"
          >
            {aiResult ? (
              <article className="rounded-2xl border border-(--card-border) bg-white/80 p-3 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--text-soft)">
                  MoodFlow AI
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-(--text-muted)">
                  {aiResult}
                </p>
              </article>
            ) : loading ? (
              <article className="rounded-2xl border border-(--card-border) bg-white/80 p-3 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--text-soft)">
                  MoodFlow AI
                </p>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                  Generating your reflection...
                </p>
              </article>
            ) : null}

            {aiError ? (
              <p className="rounded-xl border border-(--accent-pink) bg-(--accent-pink-soft) px-3 py-2 text-sm text-(--text-primary)">
                {aiError}
              </p>
            ) : null}

            {qaHistory.map((item) => (
              <div key={item.id} className="space-y-2">
                <article className="ml-auto max-w-[88%] rounded-2xl border border-(--card-border) bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--text-soft)">
                      You
                    </p>
                    <button
                      type="button"
                      className="rounded-lg border border-(--card-border) px-2 py-1 text-xs text-(--text-muted) hover:bg-(--bg-soft)"
                      onClick={() => handleEditPrompt(item)}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-(--text-primary)">
                    {item.question}
                  </p>
                </article>

                <article className="mr-auto max-w-[92%] rounded-2xl border border-(--card-border) bg-white/80 p-3 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--text-soft)">
                    MoodFlow AI
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-(--text-muted)">
                    {item.answer}
                  </p>
                </article>
              </div>
            ))}

            {followUpLoading ? (
              <article className="mr-auto max-w-[92%] rounded-2xl border border-(--card-border) bg-white/80 p-3 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--text-soft)">
                  MoodFlow AI
                </p>
                <p className="mt-1 text-sm leading-6 text-(--text-muted)">
                  Thinking...
                </p>
              </article>
            ) : null}

            <div ref={qaBottomRef} />
          </div>

          <div className="mt-4 rounded-2xl border border-(--card-border) bg-white/85 p-3 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs text-(--text-soft)">
                {editingQaId
                  ? "Editing previous prompt"
                  : "Ask a follow-up based on this reflection"}
              </p>
              <button
                type="button"
                className="rounded-lg border border-(--card-border) px-2 py-1 text-xs text-(--text-muted) hover:bg-(--bg-soft)"
                onClick={handleAiReflect}
                disabled={loading || followUpLoading}
              >
                {loading ? "Generating..." : "Regenerate"}
              </button>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={followUpQuestion}
                onChange={(event) => setFollowUpQuestion(event.target.value)}
                rows={2}
                placeholder="Type your question..."
                className="min-h-14 flex-1 resize-none rounded-xl border border-(--card-border) bg-white px-3 py-2 text-sm text-(--text-primary) outline-none"
              />
              <button
                type="button"
                className="h-14 rounded-xl bg-(--primary) px-4 text-sm font-semibold text-white disabled:opacity-60"
                onClick={handleAskFollowUp}
                disabled={
                  followUpLoading || loading || !followUpQuestion.trim()
                }
              >
                {followUpLoading
                  ? "Asking..."
                  : editingQaId
                    ? "Update"
                    : "Send"}
              </button>
            </div>

            {followUpError ? (
              <p className="mt-2 rounded-xl border border-(--accent-pink) bg-(--accent-pink-soft) px-3 py-2 text-sm text-(--text-primary)">
                {followUpError}
              </p>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  );
}
