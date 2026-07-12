"use client";

import { useState } from "react";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OrderItemRow } from "@/components/orders/OrderItemRow";

type OrderCardProps = {
  order: Order;
  items: OrderItem[];
  salespersonName: string;
  productName: (id: string | null) => string | null;
  onSelectStatus: (itemId: string, status: OrderStatus) => void;
  onMarkAllArrived?: () => void;
  markAllText?: string;
  className?: string;
  footerText?: string;
};

export function OrderCard({
  order,
  items,
  salespersonName,
  productName,
  onSelectStatus,
  onMarkAllArrived,
  markAllText = "まとめて入荷済にする",
  className = "",
  footerText,
}: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={`space-y-3 ${className}`}>
      <div 
        className="cursor-pointer flex items-start justify-between active:opacity-60"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div>
          <p className="text-sm text-slate-500">{order.orderDate}</p>
          <p className="text-lg font-bold">{order.customerName}</p>
          <p className="text-sm text-slate-500">
            営業担当：{salespersonName}
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

          {footerText && (
            <p className="text-sm text-slate-400">
              {footerText}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
