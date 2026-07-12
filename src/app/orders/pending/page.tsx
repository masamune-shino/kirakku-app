"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ARCHIVE_RETENTION_DAYS, OTHER_PRODUCT_ID, type Order } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { OrderCard } from "@/components/orders/OrderCard";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function PendingOrdersPage() {
  const { orders, products, salespersons, setItemStatus, markOrderItemsArrived } = useStore();

  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const productName = (id: string | null) =>
    id === OTHER_PRODUCT_ID || id === null
      ? null
      : products.find((p) => p.id === id)?.name ?? "(不明な商品)";

  const salespersonName = (id: string) =>
    salespersons.find((sp) => sp.id === id)?.name ?? "(不明)";

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchCustomer && !order.customerName.includes(searchCustomer)) return false;
      if (searchDateFrom && order.orderDate < searchDateFrom) return false;
      if (searchDateTo && order.orderDate > searchDateTo) return false;
      return true;
    });
  }, [orders, searchCustomer, searchDateFrom, searchDateTo]);

  const pending: { order: Order; items: Order["items"] }[] = useMemo(
    () =>
      filteredOrders
        .map((order) => ({
          order,
          items: order.items.filter((item) => item.status !== "入荷済"),
        }))
        .filter((entry) => entry.items.length > 0)
        .sort((a, b) => (a.order.orderDate < b.order.orderDate ? 1 : -1)),
    [filteredOrders],
  );

  const productSummary = useMemo(() => {
    const byProduct = new Map<string, Map<string, number>>(); // productLabel -> size -> qty
    for (const { items } of pending) {
      for (const item of items) {
        const label = productName(item.productId) ?? item.customProductName ?? "その他";
        const sizeMap = byProduct.get(label) ?? new Map<string, number>();
        sizeMap.set(item.size, (sizeMap.get(item.size) ?? 0) + item.quantity);
        byProduct.set(label, sizeMap);
      }
    }
    return byProduct;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const archived: { order: Order; items: Order["items"] }[] = useMemo(
    () =>
      filteredOrders
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
    [filteredOrders],
  );

  const archivedItemCount = archived.reduce((sum, entry) => sum + entry.items.length, 0);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 pb-10">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">発注残</h1>
          <p className="text-slate-500 text-sm mt-1">未入荷の商品明細のみ表示</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full transition-colors ${isSearchOpen ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <SearchIcon />
          </button>
        </div>
      </header>

      {isSearchOpen && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <TextField
            label="お客様名で検索"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            placeholder="例: ゆたかや"
          />
          <TextField
            label="発注日（から）"
            type="date"
            value={searchDateFrom}
            onChange={(e) => setSearchDateFrom(e.target.value)}
          />
          <TextField
            label="発注日（まで）"
            type="date"
            value={searchDateTo}
            onChange={(e) => setSearchDateTo(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              className="text-sm font-bold text-slate-500 underline"
              onClick={() => {
                setSearchCustomer("");
                setSearchDateFrom("");
                setSearchDateTo("");
              }}
            >
              条件をクリア
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-left active:bg-slate-50"
        >
          <h2 className="text-lg font-extrabold">商品別集計（発注残）</h2>
          <span className="ml-3 shrink-0 text-2xl text-slate-400">
            {summaryOpen ? "▲" : "▼"}
          </span>
        </button>

        {summaryOpen && (
          <Card>
            {productSummary.size === 0 && <p className="text-slate-500">データがありません</p>}
            <div className="space-y-4">
              {Array.from(productSummary.entries()).map(([product, sizeMap]) => (
                <div key={product}>
                  <p className="font-bold">{product}</p>
                  <ul className="ml-4">
                    {Array.from(sizeMap.entries()).map(([size, qty]) => (
                      <li key={size} className="flex justify-between border-b border-slate-100 py-1">
                        <span>{size}</span>
                        <span className="font-bold">{qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <div className="flex flex-col gap-4">
        {pending.length === 0 && (
          <p className="text-slate-500">条件に合う発注残はありません。</p>
        )}
        {pending.map(({ order, items }) => (
          <OrderCard
            key={order.id}
            order={order}
            items={items}
            salespersonName={salespersonName(order.salespersonId)}
            productName={productName}
            onSelectStatus={(itemId, s) => setItemStatus(order.id, itemId, s)}
            onMarkAllArrived={() =>
              markOrderItemsArrived(
                order.id,
                items.map((i) => i.id),
              )
            }
            markAllText="残りをまとめて入荷済にする"
          />
        ))}
      </div>

      <section className="space-y-3 mt-4">
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
              入荷済みにした商品が{ARCHIVE_RETENTION_DAYS}日間ここに残ります
            </p>
          </div>
          <span className="ml-3 shrink-0 text-2xl text-slate-400">
            {archiveOpen ? "▲" : "▼"}
          </span>
        </button>

        {archiveOpen && (
          <div className="flex flex-col gap-4">
            {archived.length === 0 && (
              <p className="text-slate-500">条件に合う入荷済みの商品はありません。</p>
            )}
            {archived.map(({ order, items }) => (
              <OrderCard
                key={order.id}
                order={order}
                items={items}
                className="bg-slate-50"
                footerText={`入荷済みから${ARCHIVE_RETENTION_DAYS}日を過ぎると自動的に削除されます`}
                salespersonName={salespersonName(order.salespersonId)}
                productName={productName}
                onSelectStatus={(itemId, s) => setItemStatus(order.id, itemId, s)}
              />
            ))}
          </div>
        )}
      </section>

      <LinkButton href="/" variant="ghost" className="mt-4">
        ホームへ戻る
      </LinkButton>
    </div>
  );
}
