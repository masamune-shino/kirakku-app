-- anon ロールにすべてのテーブルへのアクセス権を付与
-- Supabase SQL Editor で実行してください

grant usage on schema public to anon;

grant select, insert, update, delete on public.salespersons   to anon;
grant select, insert, update, delete on public.colors         to anon;
grant select, insert, update, delete on public.sizes          to anon;
grant select, insert, update, delete on public.products       to anon;
grant select, insert, update, delete on public.product_colors to anon;
grant select, insert, update, delete on public.product_sizes  to anon;
grant select, insert, update, delete on public.orders         to anon;
grant select, insert, update, delete on public.order_items    to anon;
