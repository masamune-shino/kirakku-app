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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setOpen(false)}
        >
          <div 
            className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-bold">ステータスを変更</h3>
            <div className="flex flex-col gap-3">
              {ORDER_STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onSelect(s);
                    setOpen(false);
                  }}
                  className={`rounded-2xl border-2 px-4 py-4 text-lg font-bold active:scale-95 transition-transform ${
                    statusClass[s]
                  } ${s === status ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-2xl bg-slate-100 px-4 py-4 text-lg font-bold text-slate-700 active:bg-slate-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
