"use client";

import type { OrderItem, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/orders/StatusBadge";

export function OrderItemRow({
  item,
  productName,
  onSelectStatus,
}: {
  item: OrderItem;
  productName: string | null;
  onSelectStatus: (status: OrderStatus) => void;
}) {
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <span>
          {productName ?? item.customProductName} / {item.color} / {item.size}
        </span>
        <span className="font-bold">{item.quantity}点</span>
      </div>
      <div>
        <StatusBadge status={item.status} onSelect={onSelectStatus} />
      </div>
    </li>
  );
}
