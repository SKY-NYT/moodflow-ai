export function Header() {
  return (
    <header className="mb-4 py-2 sm:mb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-(--text-primary) sm:text-4xl">
          MoodFlow
          <span className="ml-2 text-(--primary)">Reflections</span>
        </h1>
        <div className="inline-flex items-center rounded-full border border-(--brand-soft) bg-(--brand-faint) px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-(--brand-ink)">
          MoodFlow AI
        </div>
      </div>
    </header>
  );
}
