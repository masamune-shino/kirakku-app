export type OrderStatus = "受付" | "入荷済";

export const ORDER_STATUS_FLOW: OrderStatus[] = ["受付", "入荷済"];

export type MasterItem = {
  id: string;
  name: string;
};

export type ProductMasterItem = MasterItem & {
  colorIds: string[];
  sizeIds: string[];
};

export type CustomerMasterItem = MasterItem & {
  salespersonId: string;
};

export type OrderItem = {
  id: string;
  productId: string | null; // マスター商品のID。「その他」の場合は null
  customProductName?: string;
  color: string;
  size: string;
  quantity: number;
  status: OrderStatus;
  arrivedAt?: string; // 入荷済に変更した日時（ISO）。入荷済み一覧の自動削除判定に使用
};

export type Order = {
  id: string;
  orderDate: string; // YYYY-MM-DD
  salespersonId: string;
  customerName: string;
  memo?: string;
  items: OrderItem[];
  createdAt: string;
};

export const ARCHIVE_RETENTION_DAYS = 30;

export const OTHER_PRODUCT_ID = "other";
