import {
  formatDate,
  getMoodBadgeClass,
  getTagToneClass,
} from "../../lib/utils";
import type { JournalEntry } from "../../types/journal";

interface EntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onOpen: (entry: JournalEntry) => void;
}

export function EntryCard({ entry, onEdit, onDelete, onOpen }: EntryCardProps) {
  const moodBadgeClass = getMoodBadgeClass(entry.mood);

  return (
    <article
      className="cursor-pointer rounded-2xl bg-white/80 p-5 ring-1 ring-(--card-border) transition hover:-translate-y-0.5 hover:ring-(--brand-soft)"
      onClick={() => onOpen(entry)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-(--text-primary)">
            {entry.title}
          </h3>
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

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-(--text-muted)">
        {entry.note}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className="rounded-2xl border border-(--card-border) bg-white px-4 py-2 text-sm text-(--text-muted)"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(entry);
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(entry);
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
