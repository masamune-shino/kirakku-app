export function NumberStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 text-2xl font-bold active:bg-slate-300"
        aria-label="数量を減らす"
      >
        −
      </button>
      <span className="w-12 text-center text-2xl font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 text-2xl font-bold active:bg-slate-300"
        aria-label="数量を増やす"
      >
        ＋
      </button>
    </div>
  );
}
