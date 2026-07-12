"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ARCHIVE_RETENTION_DAYS, OTHER_PRODUCT_ID, type Order } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { OrderItemRow } from "@/components/orders/OrderItemRow";

export default function PendingOrdersPage() {
  const { orders, products, salespersons, setItemStatus, markOrderItemsArrived } = useStore();

  const productName = (id: string | null) =>
    id === OTHER_PRODUCT_ID || id === null
      ? null
      : products.find((p) => p.id === id)?.name ?? "(不明な商品)";

  const salespersonName = (id: string) =>
    salespersons.find((sp) => sp.id === id)?.name ?? "(不明)";

  const pending: { order: Order; items: Order["items"] }[] = useMemo(
    () =>
      orders
        .map((order) => ({
          order,
          items: order.items.filter((item) => item.status !== "入荷済"),
        }))
        .filter((entry) => entry.items.length > 0)
        .sort((a, b) => (a.order.orderDate < b.order.orderDate ? 1 : -1)),
    [orders],
  );

  const archived: { order: Order; items: Order["items"] }[] = useMemo(
    () =>
      orders
        .map((order) => ({
          order,
          items: order.items.filter((item) => item.status === "入荷済" && item.arrivedAt),
        }))
        .filter((entry) => entry.items.length > 0)
        .sort((a, b) => {
          const aLatest = Math.max(...a.items.map((i) => new Date(i.arrivedAt!).getTime()));
          const bLatest = Math.max(...b.items.map((i) => new Date(i.arrivedAt!).getTime()));
          return bLatest - aLatest;
        }),
    [orders],
  );

  const archivedItemCount = archived.reduce((sum, entry) => sum + entry.items.length, 0);

  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 pb-10">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">発注残</h1>
        <p className="text-slate-500">未入荷の商品明細のみ表示しています</p>
      </header>

      <div className="flex flex-col gap-4">
        {pending.length === 0 && (
          <p className="text-slate-500">発注残はありません。</p>
        )}
        {pending.map(({ order, items }) => (
          <Card key={order.id} className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{order.orderDate}</p>
              <p className="text-lg font-bold">{order.customerName}</p>
              <p className="text-sm text-slate-500">
                営業担当：{salespersonName(order.salespersonId)}
              </p>
            </div>

            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  productName={productName(item.productId)}
                  onSelectStatus={(s) => setItemStatus(order.id, item.id, s)}
                />
              ))}
            </ul>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                markOrderItemsArrived(
                  order.id,
                  items.map((item) => item.id),
                )
              }
            >
              残りをまとめて入荷済にする
            </Button>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setArchiveOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-left active:bg-slate-50"
        >
          <div>
            <h2 className="text-lg font-extrabold">
              入荷済み一覧（{archivedItemCount}件）
            </h2>
            <p className="text-sm text-slate-500">
              入荷済みにした商品が{ARCHIVE_RETENTION_DAYS}日間ここに残ります（間違えた場合はここから状態を戻せます）
            </p>
          </div>
          <span className="ml-3 shrink-0 text-2xl text-slate-400">
            {archiveOpen ? "▲" : "▼"}
          </span>
        </button>

        {archiveOpen && (
          <div className="flex flex-col gap-4">
            {archived.length === 0 && (
              <p className="text-slate-500">入荷済みの商品はありません。</p>
            )}
            {archived.map(({ order, items }) => (
              <Card key={order.id} className="space-y-3 bg-slate-50">
                <div>
                  <p className="text-sm text-slate-500">{order.orderDate}</p>
                  <p className="text-lg font-bold">{order.customerName}</p>
                  <p className="text-sm text-slate-500">
                    営業担当：{salespersonName(order.salespersonId)}
                  </p>
                </div>

                <ul className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <OrderItemRow
                      key={item.id}
                      item={item}
                      productName={productName(item.productId)}
                      onSelectStatus={(s) => setItemStatus(order.id, item.id, s)}
                    />
                  ))}
                </ul>

                <p className="text-sm text-slate-400">
                  入荷済みから{ARCHIVE_RETENTION_DAYS}日を過ぎると自動的にこの一覧から削除されます
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <LinkButton href="/" variant="ghost">
        ホームへ戻る
      </LinkButton>
    </div>
  );
}
