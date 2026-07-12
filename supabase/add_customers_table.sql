-- お客様マスター（営業担当ごとのお客様名）を追加するマイグレーション
-- Supabase ダッシュボードの SQL Editor に貼り付けて実行してください。

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  salesperson_id uuid not null references salespersons(id) on delete cascade
);

alter table customers enable row level security;
create policy "anon full access" on customers for all using (true) with check (true);
grant select, insert, update, delete on public.customers to anon;

-- 既存注文の顧客名を初期データとして取り込む（営業担当ごとに重複なし）
insert into customers (name, salesperson_id)
select distinct customer_name, salesperson_id from orders
where salesperson_id is not null;
