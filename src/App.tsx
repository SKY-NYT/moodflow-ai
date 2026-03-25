import { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Shell } from "./components/Shell";
import { Modal } from "./components/Modal";
import { DetailedReflectionPage } from "./features/entries/DetailedReflectionPage";
import { EntriesList } from "./features/entries/EntriesList";
import { FiltersBar } from "./features/entries/FiltersBar";
import { JournalForm } from "./features/entries/JournalForm";
import { filterAndSortEntries } from "./features/entries/selectors";
import { useJournalStore } from "./store/useJournalStore";
import type { JournalEntry } from "./types/journal";

interface FlashMessage {
  kind: "success" | "info" | "error";
  text: string;
}

const CREATE_MODAL_OPEN_KEY = "moodflow-ai:create-modal-open";

export default function App() {
  const entries = useJournalStore((state) => state.entries);
  const search = useJournalStore((state) => state.search);
  const selectedMood = useJournalStore((state) => state.selectedMood);
  const sortOrder = useJournalStore((state) => state.sortOrder);
  const deleteEntry = useJournalStore((state) => state.deleteEntry);

  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("reflection");
  });
  const [pendingDelete, setPendingDelete] = useState<JournalEntry | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CREATE_MODAL_OPEN_KEY) === "1";
  });
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [hasHydrated, setHasHydrated] = useState(() =>
    useJournalStore.persist.hasHydrated(),
  );

  const filteredEntries = useMemo(
    () => filterAndSortEntries(entries, search, selectedMood, sortOrder),
    [entries, search, selectedMood, sortOrder],
  );

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeEntryId) ?? null,
    [entries, activeEntryId],
  );

  const isResolvingDetail =
    Boolean(activeEntryId) && !activeEntry && !hasHydrated;
  const isDetailNotFound =
    Boolean(activeEntryId) && !activeEntry && hasHydrated;

  function syncDetailInUrl(entryId: string | null) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (entryId) {
      url.searchParams.set("reflection", entryId);
    } else {
      url.searchParams.delete("reflection");
    }
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function notify(kind: FlashMessage["kind"], text: string) {
    setFlash({ kind, text });
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(kind === "error" ? [25, 40, 25] : 20);
    }
  }

  function requestDelete(entry: JournalEntry) {
    setPendingDelete(entry);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteEntry(pendingDelete.id);
    if (activeEntryId === pendingDelete.id) {
      setActiveEntryId(null);
      syncDetailInUrl(null);
    }
    setPendingDelete(null);
    notify("info", "Reflection deleted.");
  }

  function openCreateModal() {
    setEditingEntry(null);
    setIsFormModalOpen(true);
  }

  function openEditModal(entry: JournalEntry) {
    setEditingEntry(entry);
    setIsFormModalOpen(true);
    notify("info", "Edit mode enabled.");
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    setEditingEntry(null);
  }

  function openDetail(entry: JournalEntry) {
    setActiveEntryId(entry.id);
    syncDetailInUrl(entry.id);
  }

  function closeDetail() {
    setActiveEntryId(null);
    syncDetailInUrl(null);
  }

  useEffect(() => {
    const unsubscribeHydrate = useJournalStore.persist.onHydrate(() => {
      setHasHydrated(false);
    });
    const unsubscribeFinishHydration =
      useJournalStore.persist.onFinishHydration(() => {
        setHasHydrated(true);
      });

    setHasHydrated(useJournalStore.persist.hasHydrated());

    return () => {
      unsubscribeHydrate();
      unsubscribeFinishHydration();
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timeout = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isFormModalOpen) {
      window.localStorage.setItem(CREATE_MODAL_OPEN_KEY, "1");
      return;
    }
    window.localStorage.removeItem(CREATE_MODAL_OPEN_KEY);
  }, [isFormModalOpen]);

  return (
    <Shell>
      <div className="hidden md:block">
        <Header />
      </div>

      <header className="mb-3 flex items-center justify-between gap-3 md:hidden">
        <h1 className="text-(--text-primary)">MoodFlow</h1>
        <button
          type="button"
          className="rounded-2xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
          onClick={openCreateModal}
        >
          New
        </button>
      </header>

      <main className="no-scrollbar mt-2 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 pr-1 md:mt-3 md:pb-0">
        {activeEntry ? (
          <DetailedReflectionPage
            entry={activeEntry}
            onBack={closeDetail}
            onDeleteRequest={requestDelete}
            onAction={notify}
          />
        ) : isResolvingDetail ? (
          <section className="mt-4 rounded-2xl border border-(--card-border) bg-(--surface) p-6">
            <h2 className="text-xl font-semibold text-(--text-primary)">
              Loading reflection...
            </h2>
            <p className="mt-2 text-sm text-(--text-muted)">
              Restoring your entry from local storage.
            </p>
          </section>
        ) : isDetailNotFound ? (
          <section className="mt-4 rounded-2xl border border-(--card-border) bg-(--surface) p-6">
            <h2 className="text-xl font-semibold text-(--text-primary)">
              Reflection not found
            </h2>
            <p className="mt-2 text-sm text-(--text-muted)">
              This reflection does not exist anymore or the link is invalid.
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-lg border border-(--primary) bg-(--brand-faint) px-3 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary) hover:text-white"
                onClick={closeDetail}
              >
                Back to journal
              </button>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            <FiltersBar onCreateReflection={openCreateModal} />
            <EntriesList
              entries={filteredEntries}
              onEdit={openEditModal}
              onDelete={requestDelete}
              onOpen={openDetail}
            />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-40 px-4 md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl border border-(--card-border) bg-(--surface) p-2 shadow-lg backdrop-blur">
          <button
            type="button"
            className="rounded-xl border border-(--card-border) bg-white px-4 py-2 text-sm font-medium text-(--text-muted)"
            onClick={() => {
              if (activeEntry) {
                closeDetail();
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            {activeEntry ? "Back" : "Journal"}
          </button>

          <button
            type="button"
            className="rounded-xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white"
            onClick={openCreateModal}
          >
            Add Reflection
          </button>
        </div>
      </nav>

      <Modal
        title={editingEntry ? "Edit Reflection" : "Create Reflection"}
        open={isFormModalOpen}
        onClose={closeFormModal}
        panelClassName={
          !editingEntry
            ? "max-w-[95vw] max-h-[92vh] flex flex-col md:max-w-none md:w-[680px] md:h-[720px]"
            : ""
        }
        contentClassName={!editingEntry ? "flex-1 overflow-y-auto pr-2" : ""}
      >
        <JournalForm
          editingEntry={editingEntry}
          onFinishEdit={closeFormModal}
          onAction={notify}
          persistDraftKey={
            !editingEntry ? "moodflow-ai:create-draft" : undefined
          }
        />
      </Modal>

      {flash ? (
        <div
          className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
          role="status"
          aria-live="polite"
        >
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur text-(--text-primary) ${
              flash.kind === "success"
                ? "border-(--secondary) bg-(--mood-calm-soft)"
                : flash.kind === "error"
                  ? "border-(--accent-pink) bg-(--accent-pink-soft)"
                  : "border-(--primary) bg-(--brand-faint)"
            }`}
          >
            {flash.text}
          </div>
        </div>
      ) : null}

      <Modal
        title="Delete reflection"
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-lg border border-(--card-border) px-4 py-2 text-sm text-(--text-muted)"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg border border-(--accent-pink) bg-(--accent-pink-soft) px-4 py-2 text-sm font-semibold text-(--text-primary)"
              onClick={confirmDelete}
            >
              Delete
            </button>
          </>
        }
      >
        {pendingDelete
          ? `Delete "${pendingDelete.title}"? This action cannot be undone.`
          : "Delete this reflection?"}
      </Modal>
    </Shell>
  );
}
