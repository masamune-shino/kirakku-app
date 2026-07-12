"use client";

import { useStore } from "@/lib/store";
import { OTHER_PRODUCT_ID } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { OrderItemRow } from "@/components/orders/OrderItemRow";

export default function OrdersPage() {
  const { orders, products, salespersons, setItemStatus, markOrderItemsArrived } = useStore();

  const productName = (id: string | null) =>
    id === OTHER_PRODUCT_ID || id === null
      ? null
      : products.find((p) => p.id === id)?.name ?? "(不明な商品)";

  const salespersonName = (id: string) =>
    salespersons.find((sp) => sp.id === id)?.name ?? "(不明)";

  const sorted = [...orders].sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 pb-10">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">発注一覧</h1>
      </header>

      <div className="flex flex-col gap-4">
        {sorted.length === 0 && <p className="text-slate-500">発注はまだありません。</p>}
        {sorted.map((order) => {
          const allArrived = order.items.every((item) => item.status === "入荷済");
          return (
            <Card key={order.id} className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">{order.orderDate}</p>
                <p className="text-lg font-bold">{order.customerName}</p>
                <p className="text-sm text-slate-500">
                  営業担当：{salespersonName(order.salespersonId)}
                </p>
              </div>

              <ul className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <OrderItemRow
                    key={item.id}
                    item={item}
                    productName={productName(item.productId)}
                    onSelectStatus={(s) => setItemStatus(order.id, item.id, s)}
                  />
                ))}
              </ul>

              {!allArrived && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    markOrderItemsArrived(
                      order.id,
                      order.items.map((item) => item.id),
                    )
                  }
                >
                  まとめて入荷済にする
                </Button>
              )}

              {order.memo && <p className="text-sm text-slate-500">備考：{order.memo}</p>}
            </Card>
          );
        })}
      </div>

      <LinkButton href="/" variant="ghost">
        ホームへ戻る
      </LinkButton>
    </div>
  );
}
