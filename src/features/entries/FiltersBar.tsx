import { moods } from "../../types/journal";
import { useJournalStore } from "../../store/useJournalStore";

interface FiltersBarProps {
  onCreateReflection: () => void;
}

export function FiltersBar({ onCreateReflection }: FiltersBarProps) {
  const search = useJournalStore((state) => state.search);
  const selectedMood = useJournalStore((state) => state.selectedMood);
  const sortOrder = useJournalStore((state) => state.sortOrder);
  const setSearch = useJournalStore((state) => state.setSearch);
  const setSelectedMood = useJournalStore((state) => state.setSelectedMood);
  const setSortOrder = useJournalStore((state) => state.setSortOrder);

  function moodBorderClass(mood: typeof selectedMood) {
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
        return "border-[#ADB5BD]";
      case "All":
      default:
        return "border-(--card-border)";
    }
  }

  return (
    <section className="rounded-2xl border border-(--card-border) bg-(--surface) p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="w-full rounded-2xl border border-(--card-border) bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft)"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, note, or tag"
          aria-label="Search reflections"
        />

        <button
          type="button"
          className="rounded-2xl bg-(--primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--primary-hover)"
          onClick={onCreateReflection}
        >
          Create Reflection
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-(--text-muted)">
          Mood filter
          <select
            className={`rounded-2xl border bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft) ${moodBorderClass(selectedMood)}`}
            value={selectedMood}
            onChange={(event) =>
              setSelectedMood(event.target.value as typeof selectedMood)
            }
          >
            <option value="All">All moods</option>
            {moods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-(--text-muted)">
          Sort order
          <select
            className="rounded-2xl border border-(--card-border) bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-(--brand-soft)"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as typeof sortOrder)
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="mood">Best mood first</option>
            <option value="energy">Highest energy first</option>
          </select>
        </label>
      </div>
    </section>
  );
}
