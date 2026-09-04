-- ==============================================================================
-- 三月森夜 (MARCH NIGHT) - Supabase PostgreSQL Schema & Security Migration
-- Version: 20260904000000
-- ==============================================================================

-- 0. 啟用 UUID 擴充功能
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 店員名冊資料表 (staff)
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  title TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'on_duty' CHECK (status IN ('on_duty', 'break', 'off_duty')),
  "centerAvailability" BOOLEAN DEFAULT true,
  "flairSpecialty" TEXT,
  "photoPriceWithoutSign" INTEGER DEFAULT 200000,
  "photoPriceWithSign" INTEGER DEFAULT 250000,
  "photoPriceWithArtSign" INTEGER DEFAULT 300000,
  "totalCenterOrdersCount" INTEGER DEFAULT 0,
  "totalChekiCount" INTEGER DEFAULT 0
);

-- 2. 調酒品項資料表 (cocktails)
CREATE TABLE IF NOT EXISTS public.cocktails (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  "alcoholLevel" INTEGER DEFAULT 2,
  price INTEGER DEFAULT 0,
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  "isSignature" BOOLEAN DEFAULT false,
  "iconColor" TEXT
);

-- 3. 席位桌號資料表 (tables)
CREATE TABLE IF NOT EXISTS public.tables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL,
  capacity INTEGER DEFAULT 2,
  "isVip" BOOLEAN DEFAULT false,
  "isAvailable" BOOLEAN DEFAULT true
);

-- 4. 訂單主表 (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNo" TEXT NOT NULL UNIQUE,
  "serviceType" TEXT NOT NULL CHECK ("serviceType" IN ('flair_bartending', 'cheki_photo')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'in_service', 'completed', 'cancelled')),
  location TEXT NOT NULL,
  "guestName" TEXT,
  "totalAmount" INTEGER DEFAULT 0,
  "createdAt" BIGINT NOT NULL,
  "guestCount" INTEGER,
  "centerStaffId" TEXT,
  "centerStaffName" TEXT,
  "centerStaffAvatar" TEXT,
  "flairTheme" TEXT,
  cocktails JSONB DEFAULT '[]'::jsonb,
  "staffId" TEXT,
  "staffName" TEXT,
  "staffAvatar" TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  "specialRequests" TEXT,
  remarks TEXT
);

-- 5. 訂單明細表 (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'cocktail' | 'cheki'
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  sub_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 效能索引建立
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON public.orders ("orderNo");
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- 7. 啟用即時變更廣播 (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cocktails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 8. 啟用 Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 9. 安全政策 (RLS Policies)

-- [Staff Policies]
-- 訪客與管理員皆可公開瀏覽店員資訊
DROP POLICY IF EXISTS "staff_read_public" ON public.staff;
CREATE POLICY "staff_read_public" ON public.staff 
  FOR SELECT TO public 
  USING (true);

-- 只有通過 Supabase Auth 驗證的管理員可新增／修改／刪除店員
DROP POLICY IF EXISTS "staff_admin_all" ON public.staff;
CREATE POLICY "staff_admin_all" ON public.staff 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- [Cocktails Policies]
-- 訪客與管理員皆可公開瀏覽菜單
DROP POLICY IF EXISTS "cocktails_read_public" ON public.cocktails;
CREATE POLICY "cocktails_read_public" ON public.cocktails 
  FOR SELECT TO public 
  USING (true);

-- 只有管理員可修改菜單
DROP POLICY IF EXISTS "cocktails_admin_all" ON public.cocktails;
CREATE POLICY "cocktails_admin_all" ON public.cocktails 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- [Tables Policies]
-- 訪客與管理員皆可公開瀏覽桌位
DROP POLICY IF EXISTS "tables_read_public" ON public.tables;
CREATE POLICY "tables_read_public" ON public.tables 
  FOR SELECT TO public 
  USING (true);

-- 只有管理員可修改桌位
DROP POLICY IF EXISTS "tables_admin_all" ON public.tables;
CREATE POLICY "tables_admin_all" ON public.tables 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- [Orders Policies]
-- 客人（含訪客）可以新增建立訂單
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
CREATE POLICY "orders_insert_public" ON public.orders 
  FOR INSERT TO public 
  WITH CHECK (true);

-- 只有通過 Supabase Auth 驗證的管理員才能 SELECT 讀取所有訂單
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
CREATE POLICY "orders_select_admin" ON public.orders 
  FOR SELECT TO authenticated 
  USING (true);

-- 只有管理員可以修改訂單狀態
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders 
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 只有管理員可以刪除或清空訂單
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin" ON public.orders 
  FOR DELETE TO authenticated 
  USING (true);

-- [Order Items Policies]
DROP POLICY IF EXISTS "order_items_insert_public" ON public.order_items;
CREATE POLICY "order_items_insert_public" ON public.order_items 
  FOR INSERT TO public 
  WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
CREATE POLICY "order_items_admin_all" ON public.order_items 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 10. 客人專用安全訂單查詢函式 (Security Definer RPC)
-- 客人僅能透過此函式查詢自己持有的 order_ids，絕無法下載或掃描其他桌號訂單
CREATE OR REPLACE FUNCTION public.get_guest_orders(order_ids uuid[])
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders 
  WHERE id = ANY(order_ids);
$$;

CREATE OR REPLACE FUNCTION public.get_guest_orders_by_text(order_ids text[])
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders 
  WHERE id::text = ANY(order_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_orders(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_orders_by_text(text[]) TO anon, authenticated;
