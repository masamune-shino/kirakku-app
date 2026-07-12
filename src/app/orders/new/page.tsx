"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, todayStr } from "@/lib/store";
import { OTHER_PRODUCT_ID } from "@/lib/types";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OrderItemForm, AddItemButton, type DraftItem } from "@/components/orders/OrderItemForm";

function emptyItem(defaultProductId: string, defaultColor: string, defaultSize: string): DraftItem {
  return { productId: defaultProductId, color: defaultColor, size: defaultSize, quantity: 1 };
}

export default function NewOrderPage() {
  const router = useRouter();
  const { products, colors, sizes, salespersons, customerNameSuggestions, addOrder } =
    useStore();

  const defaultProductId = products[0]?.id ?? OTHER_PRODUCT_ID;
  const defaultProductColor = colors.find((c) => products[0]?.colorIds.includes(c.id));
  const defaultColor = defaultProductColor?.name ?? colors[0]?.name ?? "";
  const defaultProductSize = sizes.find((s) => products[0]?.sizeIds.includes(s.id));
  const defaultSize = defaultProductSize?.name ?? sizes[0]?.name ?? "";

  const [orderDate, setOrderDate] = useState(todayStr());
  const [salespersonId, setSalespersonId] = useState(salespersons[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [memo, setMemo] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { productId: defaultProductId, color: defaultColor, size: defaultSize, quantity: 1 },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (index: number, next: DraftItem) => {
    setItems((prev) => prev.map((it, i) => (i === index ? next : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem(defaultProductId, defaultColor, defaultSize)]);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError("お客様名を入力してください");
      return;
    }
    if (!salespersonId) {
      setError("営業担当を選択してください");
      return;
    }
    const invalidOther = items.some(
      (it) => it.productId === OTHER_PRODUCT_ID && !it.customProductName?.trim(),
    );
    if (invalidOther) {
      setError("「その他」の商品名を入力してください");
      return;
    }
    if (items.length === 0) {
      setError("商品を1件以上登録してください");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await addOrder({
        orderDate,
        salespersonId,
        customerName: customerName.trim(),
        memo,
        items,
      });
      router.push("/orders");
    } catch {
      setError("発注の保存に失敗しました。通信状況を確認してもう一度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 pb-10">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">新規発注</h1>
      </header>

      <Card className="space-y-4">
        <TextField
          label="発注日"
          type="date"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
        />
        <SelectField
          label="営業担当"
          value={salespersonId}
          onChange={(e) => setSalespersonId(e.target.value)}
        >
          {salespersons.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="お客様名"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onBlur={() => {
            const trimmed = customerName.trim();
            if (!trimmed) return;
            setCustomerName(trimmed.endsWith("様") ? trimmed : `${trimmed}様`);
          }}
          placeholder="例：ゆたかや"
          list="customer-suggestions"
        />
        <datalist id="customer-suggestions">
          {customerNameSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <TextField
          label="備考"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="任意"
        />
      </Card>

      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <OrderItemForm
            key={index}
            index={index}
            item={item}
            onChange={(next) => updateItem(index, next)}
            onRemove={() => removeItem(index)}
            removable={items.length > 1}
          />
        ))}
        <AddItemButton onClick={addItem} />
      </div>

      {error && <p className="text-base font-bold text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "保存中..." : "この内容で発注する"}
        </Button>
        <LinkButton href="/" variant="ghost">
          キャンセル
        </LinkButton>
      </div>
    </div>
  );
}
