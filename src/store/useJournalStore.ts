import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId, parseTags } from "../lib/utils";
import type {
  DraftEntry,
  JournalEntry,
  Mood,
  SortOrder,
} from "../types/journal";

interface AiReflectionRecord {
  result: string;
  generatedAt: string | null;
}

interface AiQaItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

interface JournalState {
  entries: JournalEntry[];
  search: string;
  selectedMood: Mood | "All";
  sortOrder: SortOrder;
  aiEnabled: boolean;
  aiReflections: Record<string, AiReflectionRecord>;
  aiQaHistory: Record<string, AiQaItem[]>;
  hasHydrated: boolean;
  setSearch: (value: string) => void;
  setSelectedMood: (value: Mood | "All") => void;
  setSortOrder: (value: SortOrder) => void;
  setAiEnabled: (value: boolean) => void;
  setAiReflection: (
    entryId: string,
    payload: { result: string; generatedAt: string | null },
  ) => void;
  clearAiReflection: (entryId: string) => void;
  setAiQaHistory: (entryId: string, history: AiQaItem[]) => void;
  clearAiQaHistory: (entryId: string) => void;
  setHasHydrated: (value: boolean) => void;
  addEntry: (entry: DraftEntry) => void;
  updateEntry: (id: string, entry: DraftEntry) => void;
  deleteEntry: (id: string) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [
        {
          id: generateId(),
          title: "Fresh start",
          note: "I rebuilt this journal into a cleaner dashboard and I am excited to keep using it consistently.",
          mood: "Neutral",
          energy: 7,
          createdAt: new Date().toISOString(),
          tags: ["growth", "frontend"],
        },
      ],
      search: "",
      selectedMood: "All",
      sortOrder: "newest",
      aiEnabled: true,
      aiReflections: {},
      aiQaHistory: {},
      hasHydrated: false,
      setSearch: (value) => set({ search: value }),
      setSelectedMood: (value) => set({ selectedMood: value }),
      setSortOrder: (value) => set({ sortOrder: value }),
      setAiEnabled: (value) => set({ aiEnabled: value }),
      setAiReflection: (entryId, payload) =>
        set((state) => ({
          aiReflections: {
            ...state.aiReflections,
            [entryId]: {
              result: payload.result,
              generatedAt: payload.generatedAt,
            },
          },
        })),
      clearAiReflection: (entryId) =>
        set((state) => {
          const nextReflections = { ...state.aiReflections };
          delete nextReflections[entryId];
          return { aiReflections: nextReflections };
        }),
      setAiQaHistory: (entryId, history) =>
        set((state) => ({
          aiQaHistory: {
            ...state.aiQaHistory,
            [entryId]: history,
          },
        })),
      clearAiQaHistory: (entryId) =>
        set((state) => {
          const nextQaHistory = { ...state.aiQaHistory };
          delete nextQaHistory[entryId];
          return { aiQaHistory: nextQaHistory };
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              id: generateId(),
              title: entry.title.trim(),
              note: entry.note.trim(),
              mood: entry.mood,
              energy: entry.energy,
              tags: parseTags(entry.tags),
              createdAt: new Date().toISOString(),
            },
            ...state.entries,
          ],
        })),
      updateEntry: (id, entry) =>
        set((state) => ({
          entries: state.entries.map((item) =>
            item.id === id
              ? {
                  ...item,
                  title: entry.title.trim(),
                  note: entry.note.trim(),
                  mood: entry.mood,
                  energy: entry.energy,
                  tags: parseTags(entry.tags),
                }
              : item,
          ),
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "moodflow-ai-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        entries: state.entries,
        aiEnabled: state.aiEnabled,
        aiReflections: state.aiReflections,
        aiQaHistory: state.aiQaHistory,
      }),
    },
  ),
);
