-- ステータスを「受付」「入荷済」の2択に統合する（「発注済」を廃止）
update order_items set status = '受付' where status = '発注済';
