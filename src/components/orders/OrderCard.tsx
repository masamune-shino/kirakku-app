"use client";

import { useState } from "react";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OrderItemRow } from "@/components/orders/OrderItemRow";
import { getSalespersonColor } from "@/lib/salespersonColor";

type OrderCardProps = {
  order: Order;
  items: OrderItem[];
  salespersonId: string;
  salespersonName: string;
  productName: (id: string | null) => string | null;
  onSelectStatus: (itemId: string, status: OrderStatus) => void;
  onMarkAllArrived?: () => void;
  onPartialArrive?: (itemId: string, quantity: number) => void;
  onDelete?: () => void;
  markAllText?: string;
  className?: string;
  footerText?: string;
};

export function OrderCard({
  order,
  items,
  salespersonId,
  salespersonName,
  productName,
  onSelectStatus,
  onMarkAllArrived,
  onPartialArrive,
  onDelete,
  markAllText = "まとめて入荷済にする",
  className = "",
  footerText,
}: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const color = getSalespersonColor(salespersonId);

  return (
    <Card className={`space-y-3 ${className}`}>
      <div
        className="cursor-pointer flex items-start justify-between active:opacity-60"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div>
          <p className="text-sm text-slate-500">{order.orderDate}</p>
          <p className={`text-lg font-bold ${color.text}`}>{order.customerName}</p>
          <p className="mt-1 text-sm text-slate-500">
            営業担当：
            <span
              className={`ml-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${color.bg} ${color.text}`}
            >
              {salespersonName}
            </span>
          </p>
        </div>
        <div className="shrink-0 pt-2 text-2xl text-slate-400">
          {isOpen ? "▲" : "▼"}
        </div>
      </div>

      {order.memo && (
        <p className="text-sm text-slate-500">備考：{order.memo}</p>
      )}

      {isOpen && (
        <>
          <ul className="divide-y divide-slate-100 border-t border-slate-100 mt-2">
            {items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                productName={productName(item.productId)}
                onSelectStatus={(s) => onSelectStatus(item.id, s)}
                onPartialArrive={
                  onPartialArrive ? (qty) => onPartialArrive(item.id, qty) : undefined
                }
              />
            ))}
          </ul>

          {onMarkAllArrived && (
            <Button
              type="button"
              variant="secondary"
              onClick={onMarkAllArrived}
            >
              {markAllText}
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirmingDelete(true)}
            >
              この発注を削除する
            </Button>
          )}

          {footerText && (
            <p className="text-sm text-slate-400">
              {footerText}
            </p>
          )}
        </>
      )}

      {confirmingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-center text-lg font-bold">発注を削除しますか？</h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              {order.customerName} の発注が完全に削除されます。この操作は取り消せません。
            </p>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  onDelete?.();
                  setConfirmingDelete(false);
                }}
              >
                削除する
              </Button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="mt-1 rounded-2xl bg-slate-100 px-4 py-4 text-lg font-bold text-slate-700 active:bg-slate-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
