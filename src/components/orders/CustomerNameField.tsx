"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/ui/TextField";

export function CustomerNameField({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = value.trim();
    if (!query) return suggestions;
    return suggestions.filter((name) => name.includes(query));
  }, [suggestions, value]);

  const applyHonorific = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "";
    return trimmed.endsWith("様") ? trimmed : `${trimmed}様`;
  };

  return (
    <div className="relative">
      <TextField
        label="お客様名"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          onChange(applyHonorific(value));
          // タップ選択を先に処理させるため、閉じるのは少し遅らせる
          setTimeout(() => setOpen(false), 150);
        }}
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-lg">
          <ul className="flex flex-col gap-1">
            {filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(applyHonorific(name));
                    setOpen(false);
                  }}
                  className="w-full rounded-xl px-4 py-3 text-left text-lg font-bold text-slate-700 active:bg-slate-100"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
