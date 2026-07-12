"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { OTHER_PRODUCT_ID } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { LinkButton } from "@/components/ui/Button";

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const { orders, products, salespersons } = useStore();
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(todayStr());

  const productName = (id: string | null) =>
    id === OTHER_PRODUCT_ID || id === null ? null : products.find((p) => p.id === id)?.name;

  const salespersonName = (id: string) =>
    salespersons.find((sp) => sp.id === id)?.name ?? "(不明)";

  const filtered = useMemo(
    () =>
      orders.filter((o) => o.orderDate >= startDate && o.orderDate <= endDate),
    [orders, startDate, endDate],
  );

  const summary = useMemo(() => {
    const orderCount = filtered.length;
    let quantity = 0;
    let pendingCount = 0;
    let arrivedCount = 0;

    const byProduct = new Map<string, Map<string, number>>(); // productLabel -> size -> qty
    const byColor = new Map<string, number>();
    const bySize = new Map<string, number>();
    const bySalesperson = new Map<string, { count: number; quantity: number }>();

    for (const order of filtered) {
      const spName = salespersonName(order.salespersonId);
      const spEntry = bySalesperson.get(spName) ?? { count: 0, quantity: 0 };
      spEntry.count += 1;

      for (const item of order.items) {
        if (item.status !== "入荷済") pendingCount += 1;
        else arrivedCount += 1;

        quantity += item.quantity;
        spEntry.quantity += item.quantity;

        const label = productName(item.productId) ?? item.customProductName ?? "その他";
        const sizeMap = byProduct.get(label) ?? new Map<string, number>();
        sizeMap.set(item.size, (sizeMap.get(item.size) ?? 0) + item.quantity);
        byProduct.set(label, sizeMap);

        byColor.set(item.color, (byColor.get(item.color) ?? 0) + item.quantity);
        bySize.set(item.size, (bySize.get(item.size) ?? 0) + item.quantity);
      }

      bySalesperson.set(spName, spEntry);
    }

    return { orderCount, quantity, pendingCount, arrivedCount, byProduct, byColor, bySize, bySalesperson };
  }, [filtered]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 pb-10">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">集計</h1>
      </header>

      <Card className="space-y-4">
        <TextField
          label="開始日"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          label="終了日"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-sm font-bold text-slate-500">発注件数</p>
          <p className="text-3xl font-extrabold text-blue-700">{summary.orderCount}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm font-bold text-slate-500">発注数量</p>
          <p className="text-3xl font-extrabold text-blue-700">{summary.quantity}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm font-bold text-slate-500">発注残件数</p>
          <p className="text-3xl font-extrabold text-amber-600">{summary.pendingCount}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm font-bold text-slate-500">入荷済件数</p>
          <p className="text-3xl font-extrabold text-green-600">{summary.arrivedCount}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">商品別集計</h2>
        {summary.byProduct.size === 0 && <p className="text-slate-500">データがありません</p>}
        <div className="space-y-4">
          {Array.from(summary.byProduct.entries()).map(([product, sizeMap]) => (
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

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">色別集計</h2>
        {summary.byColor.size === 0 && <p className="text-slate-500">データがありません</p>}
        <ul>
          {Array.from(summary.byColor.entries()).map(([color, qty]) => (
            <li key={color} className="flex justify-between border-b border-slate-100 py-1">
              <span>{color}</span>
              <span className="font-bold">{qty}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">サイズ別集計</h2>
        {summary.bySize.size === 0 && <p className="text-slate-500">データがありません</p>}
        <ul>
          {Array.from(summary.bySize.entries()).map(([size, qty]) => (
            <li key={size} className="flex justify-between border-b border-slate-100 py-1">
              <span>{size}</span>
              <span className="font-bold">{qty}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">営業担当別集計</h2>
        {summary.bySalesperson.size === 0 && <p className="text-slate-500">データがありません</p>}
        <div className="space-y-3">
          {Array.from(summary.bySalesperson.entries()).map(([name, v]) => (
            <div key={name} className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-bold">{name}</span>
              <span>
                {v.count}件 / {v.quantity}枚
              </span>
            </div>
          ))}
        </div>
      </Card>

      <LinkButton href="/" variant="ghost">
        ホームへ戻る
      </LinkButton>
    </div>
  );
}
