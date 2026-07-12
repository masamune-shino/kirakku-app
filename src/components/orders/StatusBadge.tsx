"use client";

import { useState } from "react";
import { ORDER_STATUS_FLOW, type OrderStatus } from "@/lib/types";

const statusClass: Record<OrderStatus, string> = {
  受付: "bg-amber-100 text-amber-800 border-amber-300",
  発注済: "bg-blue-100 text-blue-800 border-blue-300",
  入荷済: "bg-green-100 text-green-800 border-green-300",
};

export function StatusBadge({
  status,
  onSelect,
}: {
  status: OrderStatus;
  onSelect: (status: OrderStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full border-2 px-4 py-2 text-base font-bold active:scale-95 ${statusClass[status]}`}
      >
        {status}
        <span className="ml-1 text-sm font-normal">（タップで変更）</span>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 flex flex-col gap-2 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-lg">
          {ORDER_STATUS_FLOW.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
              className={`whitespace-nowrap rounded-xl border-2 px-4 py-3 text-base font-bold active:scale-95 ${
                statusClass[s]
              } ${s === status ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
