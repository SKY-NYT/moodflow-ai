import type { JournalEntry, Mood } from "../types/journal";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function generateId() {
  return crypto.randomUUID?.() ?? `entry_${Date.now()}`;
}

export function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function moodScore(mood: Mood) {
  const map: Record<Mood, number> = {
    Happy: 5,
    Calm: 4,
    Neutral: 3,
    Anxious: 2,
    Angry: 2,
    Sad: 1,
  };

  return map[mood];
}

export function getMoodTone(mood: string) {
  const tones: Record<Mood, { bg: string; border: string; text: string }> = {
    Happy: {
      bg: "var(--mood-happy-soft)",
      border: "var(--mood-happy)",
      text: "var(--text-primary)",
    },
    Calm: {
      bg: "var(--mood-calm-soft)",
      border: "var(--mood-calm)",
      text: "var(--text-primary)",
    },
    Sad: {
      bg: "var(--mood-sad-soft)",
      border: "var(--mood-sad)",
      text: "#e8eefb",
    },
    Angry: {
      bg: "var(--mood-angry-soft)",
      border: "var(--mood-angry)",
      text: "#40231b",
    },
    Anxious: {
      bg: "var(--mood-anxious-soft)",
      border: "var(--mood-anxious)",
      text: "#ffffff",
    },
    Neutral: {
      bg: "var(--mood-neutral-soft)",
      border: "var(--mood-neutral)",
      text: "var(--text-primary)",
    },
  };

  return tones[mood as Mood] ?? tones.Neutral;
}

export function getMoodBadgeClass(mood: Mood) {
  const map: Record<Mood, string> = {
    Happy: "border-[#FFD166] bg-[#FFF8DF] text-[#1F2933]",
    Calm: "border-[#95D5B2] bg-[#EBF8F1] text-[#1F2933]",
    Sad: "border-[#6C8EBF] bg-[#EDF2F9] text-[#1F2933]",
    Angry: "border-[#E76F51] bg-[#FCEEEA] text-[#1F2933]",
    Anxious: "border-[#B5838D] bg-[#F6EDF3] text-[#1F2933]",
    Neutral: "border-[#ADB5BD] bg-[#F1F3F5] text-[#1F2933]",
  };

  return map[mood];
}

export function getTagTone(seed: string, index: number) {
  const palettes = [
    {
      bg: "var(--accent-peach-soft)",
      border: "var(--accent-peach)",
      text: "#5b4025",
    },
    {
      bg: "var(--accent-pink-soft)",
      border: "var(--accent-pink)",
      text: "#5e3538",
    },
    {
      bg: "var(--accent-lavender-soft)",
      border: "var(--accent-lavender)",
      text: "#4f3c4d",
    },
    {
      bg: "var(--accent-yellow-soft)",
      border: "var(--accent-yellow)",
      text: "#5b4c23",
    },
  ];

  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return palettes[(hash + index) % palettes.length];
}

export function getTagToneClass(seed: string, index: number) {
  const classes = [
    "border-[#F4A261] bg-[#FDF0E7] text-[#5B4025]",
    "border-[#E5989B] bg-[#FBEEF0] text-[#5E3538]",
    "border-[#B5838D] bg-[#F7EDF1] text-[#4F3C4D]",
    "border-[#FFD166] bg-[#FFF7DE] text-[#5B4C23]",
  ];

  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return classes[(hash + index) % classes.length];
}

export function getEntrySummary(entries: JournalEntry[]) {
  const total = entries.length;
  const avgEnergy =
    total === 0
      ? 0
      : Math.round(
          entries.reduce((sum, entry) => sum + entry.energy, 0) / total,
        );

  const moodCounts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] ?? 0) + 1;
    return acc;
  }, {});

  const dominantMood =
    Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "No mood yet";

  const positivity =
    total === 0
      ? 0
      : Math.round(
          (entries.reduce((sum, entry) => sum + moodScore(entry.mood), 0) /
            (total * 5)) *
            100,
        );

  return {
    total,
    avgEnergy,
    dominantMood,
    positivity,
  };
}
