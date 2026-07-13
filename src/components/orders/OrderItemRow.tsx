"use client";

import { useState } from "react";
import type { OrderItem, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Button } from "@/components/ui/Button";

export function OrderItemRow({
  item,
  productName,
  onSelectStatus,
  onPartialArrive,
}: {
  item: OrderItem;
  productName: string | null;
  onSelectStatus: (status: OrderStatus) => void;
  onPartialArrive?: (quantity: number) => void;
}) {
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialQuantity, setPartialQuantity] = useState(item.quantity);

  const showPartialLink =
    !!onPartialArrive && item.status !== "入荷済" && item.quantity > 1;

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <span>
          {productName ?? item.customProductName} / {item.color} / {item.size}
        </span>
        <span className="font-bold">{item.quantity}点</span>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={item.status} onSelect={onSelectStatus} />
        {showPartialLink && (
          <button
            type="button"
            onClick={() => {
              setPartialQuantity(item.quantity);
              setPartialOpen(true);
            }}
            className="text-sm font-bold text-blue-700 underline"
          >
            一部を入荷済にする
          </button>
        )}
      </div>

      {partialOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setPartialOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-bold">
              入荷させる数量を選んでください
            </h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              {productName ?? item.customProductName} / {item.color} / {item.size}
              （全{item.quantity}点）
            </p>
            <div className="mb-6 flex justify-center">
              <NumberStepper
                value={partialQuantity}
                onChange={setPartialQuantity}
                min={1}
                max={item.quantity}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => {
                  onPartialArrive?.(partialQuantity);
                  setPartialOpen(false);
                }}
              >
                この数量を入荷済にする
              </Button>
              <button
                type="button"
                onClick={() => setPartialOpen(false)}
                className="mt-1 rounded-2xl bg-slate-100 px-4 py-4 text-lg font-bold text-slate-700 active:bg-slate-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
