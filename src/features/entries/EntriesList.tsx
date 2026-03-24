import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "../../components/SectionCard";
import type { JournalEntry } from "../../types/journal";
import { EntryCard } from "./EntryCard";

const CARDS_PER_PAGE = 2;

interface EntriesListProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onOpen: (entry: JournalEntry) => void;
}

export function EntriesList({
  entries,
  onEdit,
  onDelete,
  onOpen,
}: EntriesListProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / CARDS_PER_PAGE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const visibleEntries = useMemo(() => {
    const start = (page - 1) * CARDS_PER_PAGE;
    const end = start + CARDS_PER_PAGE;
    return entries.slice(start, end);
  }, [entries, page]);

  return (
    <SectionCard
      title="Your reflections"
      description={
        entries.length === 0
          ? "No entries match your current filter."
          : `${entries.length} reflection${entries.length === 1 ? "" : "s"} shown`
      }
    >
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
          Try another search or add a fresh reflection.
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}

          {totalPages > 1 ? (
            <div className="mt-1 mx-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-(--card-border) bg-(--bg-soft) px-3 py-2 text-sm text-(--text-muted) md:w-1/5 md:min-w-65">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-(--card-border) bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages}
                className="rounded-lg border border-(--card-border) bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
