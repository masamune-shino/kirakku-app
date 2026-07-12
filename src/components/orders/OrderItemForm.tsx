"use client";

import { useStore } from "@/lib/store";
import { OTHER_PRODUCT_ID, type OrderItem } from "@/lib/types";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Button } from "@/components/ui/Button";

export type DraftItem = Omit<OrderItem, "id" | "status" | "arrivedAt">;

export function OrderItemForm({
  index,
  item,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  item: DraftItem;
  onChange: (next: DraftItem) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const { products, colors, sizes } = useStore();
  const isOther = item.productId === OTHER_PRODUCT_ID;
  const selectedProduct = products.find((p) => p.id === item.productId);
  const availableColors = isOther
    ? colors
    : colors.filter((c) => selectedProduct?.colorIds.includes(c.id));
  const availableSizes = isOther
    ? sizes
    : sizes.filter((s) => selectedProduct?.sizeIds.includes(s.id));

  return (
    <div className="space-y-3 rounded-2xl border-2 border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-slate-500">商品 {index + 1}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-base font-bold text-red-600 active:text-red-800"
          >
            削除
          </button>
        )}
      </div>

      <SelectField
        label="商品"
        value={item.productId ?? OTHER_PRODUCT_ID}
        onChange={(e) => {
          const value = e.target.value;
          if (value === OTHER_PRODUCT_ID) {
            onChange({
              ...item,
              productId: OTHER_PRODUCT_ID,
              customProductName: "",
              color: colors[0]?.name ?? "",
              size: sizes[0]?.name ?? "",
            });
          } else {
            const nextProduct = products.find((p) => p.id === value);
            const nextColors = colors.filter((c) => nextProduct?.colorIds.includes(c.id));
            const nextSizes = sizes.filter((s) => nextProduct?.sizeIds.includes(s.id));
            const keepColor = nextColors.some((c) => c.name === item.color);
            const keepSize = nextSizes.some((s) => s.name === item.size);
            onChange({
              ...item,
              productId: value,
              customProductName: undefined,
              color: keepColor ? item.color : nextColors[0]?.name ?? "",
              size: keepSize ? item.size : nextSizes[0]?.name ?? "",
            });
          }
        }}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
        <option value={OTHER_PRODUCT_ID}>その他</option>
      </SelectField>

      {isOther && (
        <TextField
          label="商品名（自由入力）"
          value={item.customProductName ?? ""}
          onChange={(e) => onChange({ ...item, customProductName: e.target.value })}
          placeholder="商品名を入力"
        />
      )}

      {availableColors.length === 0 ? (
        <p className="text-base font-bold text-amber-600">
          この商品には色が登録されていません。マスター管理で設定してください。
        </p>
      ) : (
        <SelectField
          label="色"
          value={item.color}
          onChange={(e) => onChange({ ...item, color: e.target.value })}
        >
          {availableColors.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </SelectField>
      )}

      {availableSizes.length === 0 ? (
        <p className="text-base font-bold text-amber-600">
          この商品にはサイズが登録されていません。マスター管理で設定してください。
        </p>
      ) : (
        <SelectField
          label="サイズ"
          value={item.size}
          onChange={(e) => onChange({ ...item, size: e.target.value })}
        >
          {availableSizes.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </SelectField>
      )}

      <div>
        <span className="mb-1 block text-base font-bold text-slate-700">数量</span>
        <NumberStepper
          value={item.quantity}
          onChange={(next) => onChange({ ...item, quantity: next })}
        />
      </div>
    </div>
  );
}

export function AddItemButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick}>
      ＋ 商品追加
    </Button>
  );
}
