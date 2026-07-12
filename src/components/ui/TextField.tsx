import type { InputHTMLAttributes } from "react";

export function TextField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-base font-bold text-slate-700">{label}</span>
      )}
      <input
        className={`w-full min-w-0 max-w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg ${
          props.type === "date" ? "text-base" : ""
        } ${className}`}
        {...props}
      />
    </label>
  );
}
