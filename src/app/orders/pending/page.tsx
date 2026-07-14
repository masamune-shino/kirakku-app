"use client";

import { useMemo, useRef, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { ARCHIVE_RETENTION_DAYS, ORDER_STATUS_FLOW, OTHER_PRODUCT_ID, type Order, type OrderItem, type OrderStatus } from "@/lib/types";
import { buildPendingWorkbook, downloadXlsx, parseXlsxRows } from "@/lib/orderXlsx";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { OrderCard } from "@/components/orders/OrderCard";
import { buildSalespersonColorMap } from "@/lib/salespersonColor";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export default function PendingOrdersPage() {
  const {
    orders,
    products,
    salespersons,
    setItemStatus,
    markOrderItemsArrived,
    updateItemsStatus,
    splitItemArrived,
  } = useStore();

  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [searchSalespersonId, setSearchSalespersonId] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [importResult, setImportResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (searchSalespersonId && order.salespersonId !== searchSalespersonId) return false;
      return true;
    });
  }, [orders, searchCustomer, searchDateFrom, searchDateTo, searchSalespersonId]);

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

  const handleExportXlsx = async () => {
    const header = [
      "item_id",
      "order_id",
      "発注日",
      "お客様名",
      "営業担当",
      "商品",
      "色",
      "サイズ",
      "数量",
      "ステータス",
      "入荷数量",
    ];
    const rows = pending.flatMap(({ order, items }) =>
      items.map((item) => [
        item.id,
        order.id,
        order.orderDate,
        order.customerName,
        salespersonName(order.salespersonId),
        productName(item.productId) ?? item.customProductName ?? "その他",
        item.color,
        item.size,
        String(item.quantity),
        item.status,
        "",
      ]),
    );
    const workbook = buildPendingWorkbook(header, rows);
    await downloadXlsx(`kirakku_発注残_${todayStr()}.xlsx`, workbook);
  };

  const handleImportClick = () => {
    setImportResult("");
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const rows = await parseXlsxRows(buffer);
    if (rows.length === 0) {
      setImportResult("ファイルにデータがありませんでした。");
      return;
    }

    const [header, ...dataRows] = rows;
    const itemIdIndex = header.indexOf("item_id");
    const statusIndex = header.indexOf("ステータス");
    const arrivedQtyIndex = header.indexOf("入荷数量");
    if (itemIdIndex === -1 || statusIndex === -1) {
      setImportResult("ファイルの形式が正しくありません（item_id列またはステータス列が見つかりません）。");
      return;
    }

    const normalizeStatus = (raw: string): OrderStatus | null => {
      const trimmed = raw.trim();
      return (ORDER_STATUS_FLOW as string[]).includes(trimmed) ? (trimmed as OrderStatus) : null;
    };

    const findItem = (itemId: string): { orderId: string; item: OrderItem } | null => {
      for (const order of orders) {
        const item = order.items.find((i) => i.id === itemId);
        if (item) return { orderId: order.id, item };
      }
      return null;
    };

    const idsByStatus = new Map<OrderStatus, string[]>();
    const splitTargets: { orderId: string; item: OrderItem; arrivedQuantity: number }[] = [];
    let skipped = 0;

    for (const row of dataRows) {
      const itemId = row[itemIdIndex];
      if (!itemId) continue;

      const arrivedQtyRaw = arrivedQtyIndex !== -1 ? (row[arrivedQtyIndex] ?? "").trim() : "";
      const arrivedQuantity = arrivedQtyRaw ? Number(arrivedQtyRaw) : null;
      const found = findItem(itemId);

      if (found && arrivedQuantity !== null && Number.isFinite(arrivedQuantity) && arrivedQuantity > 0) {
        if (arrivedQuantity >= found.item.quantity) {
          const ids = idsByStatus.get("入荷済") ?? [];
          ids.push(itemId);
          idsByStatus.set("入荷済", ids);
          continue;
        }
        splitTargets.push({ orderId: found.orderId, item: found.item, arrivedQuantity });
        continue;
      }

      const status = normalizeStatus(row[statusIndex] ?? "");
      if (!status) {
        skipped += 1;
        continue;
      }

      const ids = idsByStatus.get(status) ?? [];
      ids.push(itemId);
      idsByStatus.set(status, ids);
    }

    const updatedCount =
      [...idsByStatus.values()].reduce((sum, ids) => sum + ids.length, 0) + splitTargets.length;
    if (updatedCount === 0) {
      setImportResult("更新する明細がありませんでした。");
      return;
    }

    await Promise.all([
      ...[...idsByStatus.entries()].map(([status, ids]) => updateItemsStatus(ids, status)),
      ...splitTargets.map(({ orderId, item, arrivedQuantity }) =>
        splitItemArrived(orderId, item, arrivedQuantity),
      ),
    ]);

    const splitNote = splitTargets.length > 0 ? `（うち${splitTargets.length}件は一部入荷）` : "";
    setImportResult(
      skipped > 0
        ? `${updatedCount}件を更新しました${splitNote}（うち${skipped}件はステータス列が不正なためスキップ）。`
        : `${updatedCount}件を更新しました${splitNote}。`,
    );
  };

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
            onClick={handleExportXlsx}
            title="発注残をExcel出力"
            className="p-2 rounded-full transition-colors text-slate-500 hover:bg-slate-100"
          >
            <DownloadIcon />
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            title="Excelを取り込んで消し込む"
            className="p-2 rounded-full transition-colors text-slate-500 hover:bg-slate-100"
          >
            <UploadIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full transition-colors ${isSearchOpen ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <SearchIcon />
          </button>
        </div>
      </header>

      {importResult && (
        <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {importResult}
        </p>
      )}

      {isSearchOpen && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <TextField
            label="お客様名で検索"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            placeholder="例: ゆたかや"
          />
          <SelectField
            label="営業担当で検索"
            value={searchSalespersonId}
            onChange={(e) => setSearchSalespersonId(e.target.value)}
          >
            <option value="">すべて</option>
            {salespersons.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </SelectField>
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
                setSearchSalespersonId("");
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
            salespersonColor={salespersonColorMap.get(order.salespersonId)}
            salespersonName={salespersonName(order.salespersonId)}
            productName={productName}
            onSelectStatus={(itemId, s) => setItemStatus(order.id, itemId, s)}
            onMarkAllArrived={() =>
              markOrderItemsArrived(
                order.id,
                items.map((i) => i.id),
              )
            }
            onPartialArrive={(itemId, qty) => {
              const item = items.find((i) => i.id === itemId);
              if (item) splitItemArrived(order.id, item, qty);
            }}
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
                salespersonColor={salespersonColorMap.get(order.salespersonId)}
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
