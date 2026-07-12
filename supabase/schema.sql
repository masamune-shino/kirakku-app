-- き楽っく発注アプリ: Supabase スキーマ + 初期データ
-- Supabase ダッシュボードの SQL Editor にこのファイルの内容を貼り付けて実行してください。

-- ============================================================
-- テーブル作成
-- ============================================================

create table salespersons (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table colors (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table product_colors (
  product_id uuid not null references products(id) on delete cascade,
  color_id   uuid not null references colors(id) on delete cascade,
  primary key (product_id, color_id)
);

create table product_sizes (
  product_id uuid not null references products(id) on delete cascade,
  size_id    uuid not null references sizes(id) on delete cascade,
  primary key (product_id, size_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_date date not null,
  salesperson_id uuid references salespersons(id) on delete set null,
  customer_name text not null,
  memo text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null, -- 「その他」商品の場合はNULL
  custom_product_name text,
  color text not null,
  size text not null,
  quantity integer not null,
  status text not null default '受付',
  arrived_at timestamptz
);

-- ============================================================
-- RLS（暫定: ログイン未実装のため anon ロールに全操作を許可）
-- 認証機能を追加したら、このポリシーは必ず見直すこと。
-- ============================================================

alter table salespersons enable row level security;
alter table colors enable row level security;
alter table sizes enable row level security;
alter table products enable row level security;
alter table product_colors enable row level security;
alter table product_sizes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "anon full access" on salespersons for all using (true) with check (true);
create policy "anon full access" on colors for all using (true) with check (true);
create policy "anon full access" on sizes for all using (true) with check (true);
create policy "anon full access" on products for all using (true) with check (true);
create policy "anon full access" on product_colors for all using (true) with check (true);
create policy "anon full access" on product_sizes for all using (true) with check (true);
create policy "anon full access" on orders for all using (true) with check (true);
create policy "anon full access" on order_items for all using (true) with check (true);

-- ============================================================
-- anon ロールへのテーブルアクセス権付与
-- ============================================================

grant usage on schema public to anon;

grant select, insert, update, delete on public.salespersons   to anon;
grant select, insert, update, delete on public.colors         to anon;
grant select, insert, update, delete on public.sizes          to anon;
grant select, insert, update, delete on public.products       to anon;
grant select, insert, update, delete on public.product_colors to anon;
grant select, insert, update, delete on public.product_sizes  to anon;
grant select, insert, update, delete on public.orders         to anon;
grant select, insert, update, delete on public.order_items    to anon;

-- ============================================================
-- 初期データ（アプリのサンプルデータと同一内容）
-- ============================================================

insert into colors (name) values
  ('オフホワイト'), ('ミント'), ('ベビーピンク'), ('ライラック'), ('白'),
  ('灰桜（はいざくら）'), ('白茶（しらちゃ）'), ('浅葱（あさぎ）'), ('市松'), ('水玉'),
  ('唐草（グリーン）'), ('ホワイト'), ('ペパーミント'), ('袖あり'), ('袖なし');

insert into sizes (name) values
  ('S'), ('S-fit'), ('M'), ('M-fit'), ('L'), ('L-fit'), ('LL');

insert into salespersons (name) values
  ('東垣'), ('藤原'), ('林'), ('加島'), ('村下'), ('正宗'), ('大賀'), ('土肥');

insert into products (name) values
  ('ベーシック'), ('涼'), ('ひんやりPremium'),
  ('一花（いちか）'), ('千花（せんか）'), ('百花（ひゃっか）'),
  ('半襦袢　冬'), ('半襦袢　涼'),
  ('MEN''S　長襦袢'), ('MEN''S　半襦袢'), ('MEN''S　涼　長襦袢'), ('MEN''S　涼　半襦袢'),
  ('美楽っく');

insert into product_colors (product_id, color_id)
select p.id, c.id from products p join colors c on true
where (p.name, c.name) in (
  ('ベーシック', '袖あり'), ('ベーシック', '袖なし'),
  ('涼', '袖あり'), ('涼', '袖なし'),
  ('ひんやりPremium', 'オフホワイト'), ('ひんやりPremium', 'ミント'),
  ('一花（いちか）', 'ベビーピンク'), ('一花（いちか）', 'ライラック'),
  ('千花（せんか）', '白'), ('千花（せんか）', '灰桜（はいざくら）'),
  ('千花（せんか）', '白茶（しらちゃ）'), ('千花（せんか）', '浅葱（あさぎ）'),
  ('百花（ひゃっか）', '市松'),
  ('半襦袢　冬', '水玉'),
  ('半襦袢　涼', '唐草（グリーン）'),
  ('美楽っく', 'ホワイト'), ('美楽っく', 'ペパーミント')
);

insert into product_sizes (product_id, size_id)
select p.id, s.id from products p join sizes s on true
where (p.name, s.name) in (
  ('ベーシック', 'S'), ('ベーシック', 'S-fit'), ('ベーシック', 'M'), ('ベーシック', 'M-fit'), ('ベーシック', 'L'), ('ベーシック', 'L-fit'),
  ('涼', 'S'), ('涼', 'S-fit'), ('涼', 'M'), ('涼', 'M-fit'), ('涼', 'L'), ('涼', 'L-fit'),
  ('ひんやりPremium', 'S'), ('ひんやりPremium', 'S-fit'), ('ひんやりPremium', 'M'), ('ひんやりPremium', 'M-fit'), ('ひんやりPremium', 'L'), ('ひんやりPremium', 'L-fit'),
  ('一花（いちか）', 'S'), ('一花（いちか）', 'M'), ('一花（いちか）', 'L'),
  ('千花（せんか）', 'S'), ('千花（せんか）', 'M'), ('千花（せんか）', 'L'),
  ('百花（ひゃっか）', 'S'), ('百花（ひゃっか）', 'M'), ('百花（ひゃっか）', 'L'),
  ('半襦袢　冬', 'S'), ('半襦袢　冬', 'M'), ('半襦袢　冬', 'L'),
  ('半襦袢　涼', 'S'), ('半襦袢　涼', 'M'), ('半襦袢　涼', 'L'),
  ('MEN''S　長襦袢', 'M'), ('MEN''S　長襦袢', 'L'), ('MEN''S　長襦袢', 'LL'),
  ('MEN''S　半襦袢', 'M'), ('MEN''S　半襦袢', 'L'), ('MEN''S　半襦袢', 'LL'),
  ('MEN''S　涼　長襦袢', 'M'), ('MEN''S　涼　長襦袢', 'L'), ('MEN''S　涼　長襦袢', 'LL'),
  ('MEN''S　涼　半襦袢', 'M'), ('MEN''S　涼　半襦袢', 'L'), ('MEN''S　涼　半襦袢', 'LL'),
  ('美楽っく', 'S'), ('美楽っく', 'M'), ('美楽っく', 'L'), ('美楽っく', 'LL')
);

-- サンプル発注3件
with o1 as (
  insert into orders (order_date, salesperson_id, customer_name, memo)
  select current_date, sp.id, 'ゆたかや様', ''
  from salespersons sp where sp.name = '東垣'
  returning id
)
insert into order_items (order_id, product_id, color, size, quantity, status, arrived_at)
select o1.id, p.id, '白', 'M', 2, '受付', null
from o1, products p where p.name = '千花（せんか）'
union all
select o1.id, p.id, '白', 'L', 1, '入荷済', now()
from o1, products p where p.name = '千花（せんか）';

with o2 as (
  insert into orders (order_date, salesperson_id, customer_name, memo)
  select current_date, sp.id, 'さくら商店様', ''
  from salespersons sp where sp.name = '藤原'
  returning id
)
insert into order_items (order_id, product_id, color, size, quantity, status)
select o2.id, p.id, 'ベビーピンク', 'L', 3, '発注済'
from o2, products p where p.name = '一花（いちか）';

with o3 as (
  insert into orders (order_date, salesperson_id, customer_name, memo)
  select current_date, sp.id, 'みどり様', ''
  from salespersons sp where sp.name = '東垣'
  returning id
)
insert into order_items (order_id, product_id, color, size, quantity, status, arrived_at)
select o3.id, p.id, 'ホワイト', 'LL', 1, '入荷済', now()
from o3, products p where p.name = '美楽っく';
