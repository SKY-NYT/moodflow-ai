interface StatCardProps {
  label: string;
  value: string | number;
  helper: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200/80">
      <div className="mb-2 h-1 w-10 rounded-full bg-emerald-300" />
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
        {helper}
      </p>
    </div>
  );
}
