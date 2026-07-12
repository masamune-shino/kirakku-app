"use client";

import { useMemo } from "react";
import { useStore, todayStr } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export default function Home() {
  const { orders } = useStore();

  const todayCount = useMemo(
    () => orders.filter((o) => o.orderDate === todayStr()).length,
    [orders],
  );
  const pendingCount = useMemo(
    () =>
      orders.reduce(
        (sum, o) => sum + o.items.filter((item) => item.status !== "入荷済").length,
        0,
      ),
    [orders],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-5">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">き楽っく発注アプリ</h1>
        <p className="text-slate-500">ホーム</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-base font-bold text-slate-500">本日の発注件数</p>
          <p className="mt-1 text-4xl font-extrabold text-blue-700">{todayCount}</p>
        </Card>
        <Card className="text-center">
          <p className="text-base font-bold text-slate-500">発注残件数</p>
          <p className="mt-1 text-4xl font-extrabold text-amber-600">{pendingCount}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <LinkButton href="/orders/new" variant="primary">
          ＋ 新規発注
        </LinkButton>
        <LinkButton href="/orders" variant="secondary">
          発注一覧
        </LinkButton>
        <LinkButton href="/orders/pending" variant="secondary">
          発注残
        </LinkButton>
        <LinkButton href="/reports" variant="secondary">
          集計
        </LinkButton>
        <LinkButton href="/masters" variant="ghost">
          マスター管理
        </LinkButton>
      </div>
    </div>
  );
}
