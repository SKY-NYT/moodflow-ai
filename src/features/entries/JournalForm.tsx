import { useEffect, useMemo, useState } from "react";
import { moods, type DraftEntry, type JournalEntry } from "../../types/journal";
import { useJournalStore } from "../../store/useJournalStore";

const initialDraft: DraftEntry = {
  title: "",
  note: "",
  mood: "Happy",
  energy: 6,
  tags: "",
};

interface JournalFormProps {
  editingEntry?: JournalEntry | null;
  onFinishEdit: () => void;
  onAction?: (kind: "success" | "info" | "error", text: string) => void;
  persistDraftKey?: string;
}

export function JournalForm({
  editingEntry,
  onFinishEdit,
  onAction,
  persistDraftKey,
}: JournalFormProps) {
  const addEntry = useJournalStore((state) => state.addEntry);
  const updateEntry = useJournalStore((state) => state.updateEntry);

  const computedDraft = useMemo<DraftEntry>(() => {
    if (!editingEntry) return initialDraft;
    return {
      title: editingEntry.title,
      note: editingEntry.note,
      mood: editingEntry.mood,
      energy: editingEntry.energy,
      tags: editingEntry.tags.join(", "),
    };
  }, [editingEntry]);

  const [draft, setDraft] = useState<DraftEntry>(computedDraft);
  const [touched, setTouched] = useState({ title: false, note: false });

  useEffect(() => {
    setDraft(computedDraft);
    setTouched({ title: false, note: false });
  }, [computedDraft]);

  useEffect(() => {
    if (editingEntry || !persistDraftKey) return;
    try {
      const raw = window.localStorage.getItem(persistDraftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DraftEntry>;
      setDraft((current) => ({
        ...current,
        ...parsed,
      }));
    } catch {
      // Ignore malformed draft data and continue with the default state.
    }
  }, [editingEntry, persistDraftKey]);

  useEffect(() => {
    if (editingEntry || !persistDraftKey) return;
    window.localStorage.setItem(persistDraftKey, JSON.stringify(draft));
  }, [draft, editingEntry, persistDraftKey]);

  const submitLabel = editingEntry ? "Update reflection" : "Create reflection";

  function moodBorderClass(mood: DraftEntry["mood"]) {
    switch (mood) {
      case "Happy":
        return "border-[#FFD166]";
      case "Calm":
        return "border-[#95D5B2]";
      case "Sad":
        return "border-[#6C8EBF]";
      case "Angry":
        return "border-[#E76F51]";
      case "Anxious":
        return "border-[#B5838D]";
      case "Neutral":
      default:
        return "border-[#ADB5BD]";
    }
  }

  const titleError =
    draft.title.trim().length < 3
      ? "Use at least 3 characters for the title."
      : "";
  const noteError =
    draft.note.trim().length < 20
      ? "Add at least 20 characters so your reflection is meaningful."
      : "";
  const isValid = !titleError && !noteError;

  function updateField<K extends keyof DraftEntry>(
    key: K,
    value: DraftEntry[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ title: true, note: true });
    if (!isValid) {
      onAction?.("error", "Please fix the highlighted fields before saving.");
      return;
    }

    if (editingEntry) {
      updateEntry(editingEntry.id, draft);
      onFinishEdit();
      onAction?.("success", "Reflection updated successfully.");
      return;
    }

    addEntry(draft);
    if (persistDraftKey) {
      window.localStorage.removeItem(persistDraftKey);
    }
    onAction?.("success", "Reflection saved.");
    onFinishEdit();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-(--text-muted)">
          Title
          <input
            className={`rounded-2xl border bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft) ${
              touched.title && titleError
                ? "border-rose-300"
                : "border-(--card-border)"
            }`}
            value={draft.title}
            onChange={(event) => updateField("title", event.target.value)}
            inputMode="text"
            onBlur={() =>
              setTouched((current) => ({ ...current, title: true }))
            }
            placeholder="Morning check-in"
            maxLength={80}
          />
          {touched.title && titleError ? (
            <span className="text-xs text-rose-700">{titleError}</span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm text-(--text-muted)">
          Mood
          <select
            className={`rounded-2xl border bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft) ${moodBorderClass(draft.mood)}`}
            value={draft.mood}
            onChange={(event) =>
              updateField("mood", event.target.value as DraftEntry["mood"])
            }
          >
            {moods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm text-(--text-muted)">
        Reflection
        <textarea
          className={`min-h-32 rounded-2xl border bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft) ${
            touched.note && noteError
              ? "border-rose-300"
              : "border-(--card-border)"
          }`}
          value={draft.note}
          inputMode="text"
          onChange={(event) => updateField("note", event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, note: true }))}
          placeholder="What happened, how did it affect you, and what would help next?"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-(--text-soft)">
            Aim for one concrete event and one takeaway.
          </span>
          <span className="text-(--text-soft)">
            {draft.note.trim().length} chars
          </span>
        </div>
        {touched.note && noteError ? (
          <span className="text-xs text-rose-700">{noteError}</span>
        ) : null}
      </label>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm text-(--text-muted)">
          Tags (optional)
          <input
            className="rounded-2xl border border-(--card-border) bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft)"
            value={draft.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            inputMode="text"
            placeholder="work, sleep, gratitude"
          />
        </label>

        <label className="grid gap-2 text-sm text-(--text-muted)">
          Energy: {draft.energy}/10
          <input
            type="range"
            min={1}
            max={10}
            value={draft.energy}
            onChange={(event) =>
              updateField("energy", Number(event.target.value))
            }
            className="mt-2"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!isValid}
          className="rounded-2xl bg-(--brand-strong) px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>

        {editingEntry ? (
          <button
            type="button"
            className="rounded-2xl border border-(--card-border) bg-white px-5 py-3 text-sm font-medium text-(--text-muted)"
            onClick={onFinishEdit}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
