"use client";

import { useMemo, useState } from "react";
import { useStore, type MasterKind } from "@/lib/store";
import type { CustomerMasterItem, MasterItem, ProductMasterItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { buildSalespersonColorMap, FALLBACK_COLOR } from "@/lib/salespersonColor";

type SimpleSectionKind = Exclude<MasterKind, "products" | "customers">;

const sections: { kind: SimpleSectionKind; label: string }[] = [
  { kind: "colors", label: "色マスター" },
  { kind: "sizes", label: "サイズマスター" },
  { kind: "salespersons", label: "営業担当マスター" },
];

function MasterSection({
  kind,
  label,
  items,
  onAdd,
  onRemove,
}: {
  kind: SimpleSectionKind;
  label: string;
  items: MasterItem[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-extrabold">{label}</h2>
      <ul className="divide-y divide-slate-100">
        {items.length === 0 && <p className="text-slate-500">登録がありません</p>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2">
            <span className="text-lg">{item.name}</span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-base font-bold text-red-600 active:text-red-800"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-3">
        <TextField
          label="新規追加"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${label}を入力`}
          id={`${kind}-input`}
        />
        <Button
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            onAdd(name);
            setName("");
          }}
        >
          追加
        </Button>
      </div>
    </Card>
  );
}

function ToggleChips({
  options,
  activeIds,
  onToggle,
  emptyLabel,
}: {
  options: MasterItem[];
  activeIds: string[];
  onToggle: (id: string) => void;
  emptyLabel: string;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = activeIds.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={`rounded-full border-2 px-4 py-2 text-base font-bold active:scale-95 ${
              active
                ? "border-blue-500 bg-blue-100 text-blue-800"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

function ProductMasterSection({
  products,
  colors,
  sizes,
  onAdd,
  onRemove,
  onSetColors,
  onSetSizes,
}: {
  products: ProductMasterItem[];
  colors: MasterItem[];
  sizes: MasterItem[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onSetColors: (productId: string, colorIds: string[]) => void;
  onSetSizes: (productId: string, sizeIds: string[]) => void;
}) {
  const [name, setName] = useState("");

  const toggleColor = (product: ProductMasterItem, colorId: string) => {
    const next = product.colorIds.includes(colorId)
      ? product.colorIds.filter((id) => id !== colorId)
      : [...product.colorIds, colorId];
    onSetColors(product.id, next);
  };

  const toggleSize = (product: ProductMasterItem, sizeId: string) => {
    const next = product.sizeIds.includes(sizeId)
      ? product.sizeIds.filter((id) => id !== sizeId)
      : [...product.sizeIds, sizeId];
    onSetSizes(product.id, next);
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-extrabold">商品マスター</h2>
      {products.length === 0 && <p className="text-slate-500">登録がありません</p>}
      <div className="space-y-5">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border-2 border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{product.name}</span>
              <button
                type="button"
                onClick={() => onRemove(product.id)}
                className="text-base font-bold text-red-600 active:text-red-800"
              >
                削除
              </button>
            </div>

            <p className="mt-2 mb-1 text-sm font-bold text-slate-500">この商品で使う色</p>
            <ToggleChips
              options={colors}
              activeIds={product.colorIds}
              onToggle={(id) => toggleColor(product, id)}
              emptyLabel="色マスターが未登録です"
            />

            <p className="mt-3 mb-1 text-sm font-bold text-slate-500">この商品のサイズ展開</p>
            <ToggleChips
              options={sizes}
              activeIds={product.sizeIds}
              onToggle={(id) => toggleSize(product, id)}
              emptyLabel="サイズマスターが未登録です"
            />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <TextField
          label="新規追加"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="商品マスターを入力"
          id="products-input"
        />
        <Button
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            onAdd(name);
            setName("");
          }}
        >
          追加
        </Button>
      </div>
    </Card>
  );
}

function CustomerAddForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="space-y-3">
      <TextField
        label="お客様を追加"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="お客様名を入力"
      />
      <Button
        type="button"
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name);
          setName("");
        }}
      >
        追加
      </Button>
    </div>
  );
}

function CustomerMasterSection({
  salespersons,
  customers,
  onAdd,
  onRemove,
}: {
  salespersons: MasterItem[];
  customers: CustomerMasterItem[];
  onAdd: (salespersonId: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const colorMap = useMemo(() => buildSalespersonColorMap(salespersons), [salespersons]);

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-extrabold">お客様マスター</h2>
      {salespersons.length === 0 && (
        <p className="text-slate-500">営業担当マスターを先に登録してください</p>
      )}
      <div className="space-y-5">
        {salespersons.map((sp) => {
          const spCustomers = customers.filter((c) => c.salespersonId === sp.id);
          const color = colorMap.get(sp.id) ?? FALLBACK_COLOR;
          return (
            <div key={sp.id} className="rounded-2xl border-2 border-slate-100 p-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-lg font-bold ${color.bg} ${color.text}`}
              >
                {sp.name}
              </span>
              <ul className="divide-y divide-slate-100">
                {spCustomers.length === 0 && (
                  <p className="py-2 text-sm text-slate-500">お客様の登録がありません</p>
                )}
                {spCustomers.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="text-lg">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(c.id)}
                      className="text-base font-bold text-red-600 active:text-red-800"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <CustomerAddForm onAdd={(name) => onAdd(sp.id, name)} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function MastersPage() {
  const {
    products,
    colors,
    sizes,
    salespersons,
    customers,
    addMasterItem,
    removeMasterItem,
    setProductColors,
    setProductSizes,
    addCustomer,
  } = useStore();

  const dataByKind: Record<SimpleSectionKind, MasterItem[]> = {
    colors,
    sizes,
    salespersons,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 pb-10">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">マスター管理</h1>
        <p className="text-slate-500">※ 本MVPでは編集権限のチェックは行っていません</p>
      </header>

      <ProductMasterSection
        products={products}
        colors={colors}
        sizes={sizes}
        onAdd={(name) => addMasterItem("products", name)}
        onRemove={(id) => removeMasterItem("products", id)}
        onSetColors={setProductColors}
        onSetSizes={setProductSizes}
      />

      {sections.map((section) => (
        <MasterSection
          key={section.kind}
          kind={section.kind}
          label={section.label}
          items={dataByKind[section.kind]}
          onAdd={(name) => addMasterItem(section.kind, name)}
          onRemove={(id) => removeMasterItem(section.kind, id)}
        />
      ))}

      <CustomerMasterSection
        salespersons={salespersons}
        customers={customers}
        onAdd={addCustomer}
        onRemove={(id) => removeMasterItem("customers", id)}
      />

      <LinkButton href="/" variant="ghost">
        ホームへ戻る
      </LinkButton>
    </div>
  );
}
