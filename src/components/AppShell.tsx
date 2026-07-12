"use client";

import type { ReactNode } from "react";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const { loading } = useStore();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-5">
        <p className="text-lg font-bold text-slate-500">読み込み中...</p>
      </div>
    );
  }

  return <>{children}</>;
}
