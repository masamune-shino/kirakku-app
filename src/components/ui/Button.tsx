import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "bg-blue-600 text-white active:bg-blue-700",
  secondary: "bg-white text-blue-700 border-2 border-blue-600 active:bg-blue-50",
  danger: "bg-white text-red-600 border-2 border-red-500 active:bg-red-50",
  ghost: "bg-slate-100 text-slate-700 active:bg-slate-200",
};

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-lg font-bold shadow-sm transition-colors disabled:opacity-40";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${base} ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variantClass[variant]} ${className}`}>
      {children}
    </Link>
  );
}
