"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { OTHER_PRODUCT_ID } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { OrderCard } from "@/components/orders/OrderCard";
import { buildSalespersonColorMap } from "@/lib/salespersonColor";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function OrdersPage() {
  const {
    orders,
    products,
    salespersons,
    setItemStatus,
    markOrderItemsArrived,
    splitItemArrived,
    deleteOrder,
  } = useStore();

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

  const salespersonColorMap = useMemo(
    () => buildSalespersonColorMap(salespersons),
    [salespersons],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchCustomer && !order.customerName.includes(searchCustomer)) return false;
      if (searchDateFrom && order.orderDate < searchDateFrom) return false;
      if (searchDateTo && order.orderDate > searchDateTo) return false;
      return true;
    }).sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));
  }, [orders, searchCustomer, searchDateFrom, searchDateTo]);

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 pb-10">
      <header className="pt-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">発注一覧</h1>
        <div className="flex gap-4">
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

      <div className="flex flex-col gap-4">
        {filteredOrders.length === 0 && <p className="text-slate-500">条件に合う発注はありません。</p>}
        {filteredOrders.map((order) => {
          const allArrived = order.items.every((item) => item.status === "入荷済");
          return (
            <OrderCard
              key={order.id}
              order={order}
              items={order.items}
              salespersonColor={salespersonColorMap.get(order.salespersonId)}
              salespersonName={salespersonName(order.salespersonId)}
              productName={productName}
              onSelectStatus={(itemId, s) => setItemStatus(order.id, itemId, s)}
              onMarkAllArrived={allArrived ? undefined : () => markOrderItemsArrived(order.id, order.items.map(i => i.id))}
              onPartialArrive={(itemId, qty) => {
                const item = order.items.find((i) => i.id === itemId);
                if (item) splitItemArrived(order.id, item, qty);
              }}
              onDelete={() => deleteOrder(order.id)}
            />
          );
        })}
      </div>

      <LinkButton href="/" variant="ghost">
        ホームへ戻る
      </LinkButton>
    </div>
  );
}
