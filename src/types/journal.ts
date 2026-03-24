export const moods = [
  "Happy",
  "Calm",
  "Sad",
  "Angry",
  "Anxious",
  "Neutral",
] as const;

export type Mood = (typeof moods)[number];

export interface JournalEntry {
  id: string;
  title: string;
  note: string;
  mood: Mood;
  energy: number;
  createdAt: string;
  tags: string[];
}

export interface DraftEntry {
  title: string;
  note: string;
  mood: Mood;
  energy: number;
  tags: string;
}

export type SortOrder = "newest" | "oldest" | "mood" | "energy";
