"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase/client";
import {
  ARCHIVE_RETENTION_DAYS,
  OTHER_PRODUCT_ID,
  type MasterItem,
  type Order,
  type OrderItem,
  type OrderStatus,
  type ProductMasterItem,
} from "./types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  custom_product_name: string | null;
  color: string;
  size: string;
  quantity: number;
  status: string;
  arrived_at: string | null;
};

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id ?? OTHER_PRODUCT_ID,
    customProductName: row.custom_product_name ?? undefined,
    color: row.color,
    size: row.size,
    quantity: row.quantity,
    status: row.status as OrderStatus,
    arrivedAt: row.arrived_at ?? undefined,
  };
}

type NewOrderInput = {
  orderDate: string;
  salespersonId: string;
  customerName: string;
  memo?: string;
  items: Omit<OrderItem, "id" | "status" | "arrivedAt">[];
};

type MasterKind = "products" | "colors" | "sizes" | "salespersons";
type SimpleMasterKind = Exclude<MasterKind, "products">;

type StoreValue = {
  loading: boolean;
  products: ProductMasterItem[];
  colors: MasterItem[];
  sizes: MasterItem[];
  salespersons: MasterItem[];
  orders: Order[];
  addOrder: (input: NewOrderInput) => Promise<void>;
  setItemStatus: (orderId: string, itemId: string, status: OrderStatus) => Promise<void>;
  markOrderItemsArrived: (orderId: string, itemIds: string[]) => Promise<void>;
  addMasterItem: (kind: MasterKind, name: string) => Promise<void>;
  removeMasterItem: (kind: MasterKind, id: string) => Promise<void>;
  setProductColors: (productId: string, colorIds: string[]) => Promise<void>;
  setProductSizes: (productId: string, sizeIds: string[]) => Promise<void>;
  customerNameSuggestions: string[];
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductMasterItem[]>([]);
  const [colors, setColors] = useState<MasterItem[]>([]);
  const [sizes, setSizes] = useState<MasterItem[]>([]);
  const [salespersons, setSalespersons] = useState<MasterItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadMasters = useCallback(async () => {
    const [colorsRes, sizesRes, salespersonsRes, productsRes, productColorsRes, productSizesRes] =
      await Promise.all([
        supabase.from("colors").select("id,name"),
        supabase.from("sizes").select("id,name"),
        supabase.from("salespersons").select("id,name"),
        supabase.from("products").select("id,name"),
        supabase.from("product_colors").select("product_id,color_id"),
        supabase.from("product_sizes").select("product_id,size_id"),
      ]);

    const colorsData = colorsRes.data ?? [];
    const sizesData = sizesRes.data ?? [];
    const salespersonsData = salespersonsRes.data ?? [];
    const productsData = productsRes.data ?? [];
    const productColorsData = productColorsRes.data ?? [];
    const productSizesData = productSizesRes.data ?? [];

    setColors(colorsData);
    setSizes(sizesData);
    setSalespersons(salespersonsData);
    setProducts(
      productsData.map((p) => ({
        id: p.id,
        name: p.name,
        colorIds: productColorsData
          .filter((pc) => pc.product_id === p.id)
          .map((pc) => pc.color_id),
        sizeIds: productSizesData
          .filter((ps) => ps.product_id === p.id)
          .map((ps) => ps.size_id),
      })),
    );
  }, []);

  const loadOrders = useCallback(async () => {
    const [ordersRes, orderItemsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id,order_date,salesperson_id,customer_name,memo,created_at"),
      supabase
        .from("order_items")
        .select("id,order_id,product_id,custom_product_name,color,size,quantity,status,arrived_at"),
    ]);

    const ordersData = ordersRes.data ?? [];
    const orderItemsData: OrderItemRow[] = orderItemsRes.data ?? [];

    // 入荷済みから ARCHIVE_RETENTION_DAYS 日を超えた明細はDBには残すが表示上は取り込まない
    const cutoffMs = ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const visibleItemsData = orderItemsData.filter((oi) => {
      if (oi.status !== "入荷済" || !oi.arrived_at) return true;
      return now - new Date(oi.arrived_at).getTime() < cutoffMs;
    });

    setOrders(
      ordersData
        .map((o) => ({
          id: o.id,
          orderDate: o.order_date,
          salespersonId: o.salesperson_id,
          customerName: o.customer_name,
          memo: o.memo ?? undefined,
          createdAt: o.created_at,
          items: visibleItemsData.filter((oi) => oi.order_id === o.id).map(rowToOrderItem),
        }))
        .filter((o) => o.items.length > 0),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([loadMasters(), loadOrders()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMasters, loadOrders]);

  // 他端末での発注・ステータス変更をリアルタイムに反映する
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        loadOrders();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const addOrder = useCallback(async (input: NewOrderInput) => {
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_date: input.orderDate,
        salesperson_id: input.salespersonId,
        customer_name: input.customerName,
        memo: input.memo ?? null,
      })
      .select()
      .single();
    if (orderErr || !orderRow) {
      console.error("発注の作成に失敗しました", orderErr);
      return;
    }

    const { data: itemRows, error: itemsErr } = await supabase
      .from("order_items")
      .insert(
        input.items.map((item) => ({
          order_id: orderRow.id,
          product_id: item.productId === OTHER_PRODUCT_ID ? null : item.productId,
          custom_product_name: item.customProductName ?? null,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          status: "受付",
        })),
      )
      .select();
    if (itemsErr || !itemRows) {
      console.error("発注明細の作成に失敗しました", itemsErr);
      return;
    }

    const newOrder: Order = {
      id: orderRow.id,
      orderDate: orderRow.order_date,
      salespersonId: orderRow.salesperson_id,
      customerName: orderRow.customer_name,
      memo: orderRow.memo ?? undefined,
      createdAt: orderRow.created_at,
      items: itemRows.map(rowToOrderItem),
    };
    setOrders((prev) => [newOrder, ...prev]);
  }, []);

  const setItemStatus = useCallback(
    async (orderId: string, itemId: string, status: OrderStatus) => {
      const arrivedAt = status === "入荷済" ? new Date().toISOString() : null;
      const { error } = await supabase
        .from("order_items")
        .update({ status, arrived_at: arrivedAt })
        .eq("id", itemId);
      if (error) {
        console.error("ステータスの更新に失敗しました", error);
        return;
      }
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item.id === itemId
                    ? { ...item, status, arrivedAt: arrivedAt ?? undefined }
                    : item,
                ),
              }
            : order,
        ),
      );
    },
    [],
  );

  const markOrderItemsArrived = useCallback(async (orderId: string, itemIds: string[]) => {
    if (itemIds.length === 0) return;
    const arrivedAt = new Date().toISOString();
    const { error } = await supabase
      .from("order_items")
      .update({ status: "入荷済", arrived_at: arrivedAt })
      .in("id", itemIds);
    if (error) {
      console.error("まとめて入荷済にする処理に失敗しました", error);
      return;
    }
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                itemIds.includes(item.id)
                  ? { ...item, status: "入荷済" as const, arrivedAt }
                  : item,
              ),
            }
          : order,
      ),
    );
  }, []);

  const setters: Record<SimpleMasterKind, React.Dispatch<React.SetStateAction<MasterItem[]>>> = {
    colors: setColors,
    sizes: setSizes,
    salespersons: setSalespersons,
  };

  const addMasterItem = useCallback(async (kind: MasterKind, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from(kind)
      .insert({ name: trimmed })
      .select()
      .single();
    if (error || !data) {
      console.error(`${kind} の追加に失敗しました`, error);
      return;
    }
    if (kind === "products") {
      setProducts((prev) => [...prev, { id: data.id, name: data.name, colorIds: [], sizeIds: [] }]);
      return;
    }
    setters[kind]((prev) => [...prev, { id: data.id, name: data.name }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeMasterItem = useCallback(async (kind: MasterKind, id: string) => {
    const { error } = await supabase.from(kind).delete().eq("id", id);
    if (error) {
      console.error(`${kind} の削除に失敗しました`, error);
      return;
    }
    if (kind === "products") {
      setProducts((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setters[kind]((prev) => prev.filter((item) => item.id !== id));
    if (kind === "colors") {
      setProducts((prev) =>
        prev.map((p) => ({ ...p, colorIds: p.colorIds.filter((cid) => cid !== id) })),
      );
    }
    if (kind === "sizes") {
      setProducts((prev) =>
        prev.map((p) => ({ ...p, sizeIds: p.sizeIds.filter((sid) => sid !== id) })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProductColors = useCallback(async (productId: string, colorIds: string[]) => {
    const { error: delErr } = await supabase
      .from("product_colors")
      .delete()
      .eq("product_id", productId);
    if (delErr) {
      console.error("商品の色紐づけ更新に失敗しました", delErr);
      return;
    }
    if (colorIds.length > 0) {
      const { error: insErr } = await supabase
        .from("product_colors")
        .insert(colorIds.map((colorId) => ({ product_id: productId, color_id: colorId })));
      if (insErr) {
        console.error("商品の色紐づけ更新に失敗しました", insErr);
        return;
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, colorIds } : p)));
  }, []);

  const setProductSizes = useCallback(async (productId: string, sizeIds: string[]) => {
    const { error: delErr } = await supabase
      .from("product_sizes")
      .delete()
      .eq("product_id", productId);
    if (delErr) {
      console.error("商品のサイズ紐づけ更新に失敗しました", delErr);
      return;
    }
    if (sizeIds.length > 0) {
      const { error: insErr } = await supabase
        .from("product_sizes")
        .insert(sizeIds.map((sizeId) => ({ product_id: productId, size_id: sizeId })));
      if (insErr) {
        console.error("商品のサイズ紐づけ更新に失敗しました", insErr);
        return;
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, sizeIds } : p)));
  }, []);

  const customerNameSuggestions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.customerName))),
    [orders],
  );

  const value: StoreValue = {
    loading,
    products,
    colors,
    sizes,
    salespersons,
    orders,
    addOrder,
    setItemStatus,
    markOrderItemsArrived,
    addMasterItem,
    removeMasterItem,
    setProductColors,
    setProductSizes,
    customerNameSuggestions,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { todayStr };
export type { NewOrderInput, MasterKind };
