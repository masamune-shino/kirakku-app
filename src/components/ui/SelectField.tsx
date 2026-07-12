import type { SelectHTMLAttributes } from "react";

export function SelectField({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-base font-bold text-slate-700">{label}</span>
      )}
      <select
        className={`w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
