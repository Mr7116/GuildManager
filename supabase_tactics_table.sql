-- ==============================================================================
-- 🗺️ Tactical Plans Table (ตารางแผนยุทธการ & แผนที่สำหรับกิลด์วอร์)
-- ==============================================================================
-- รันคำสั่งนี้ใน Supabase SQL Editor เพื่อให้ทุกคนในกิลด์สามารถดูแผนที่หัวกิลด์ปักหมุดไว้ได้แบบ Realtime!
-- ==============================================================================

-- 1. สร้างตาราง guild_tactics
CREATE TABLE IF NOT EXISTS public.guild_tactics (
    id INT PRIMARY KEY DEFAULT 1,
    plans JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. อนุญาตสิทธิ์อ่าน/เขียน (RLS Policies)
ALTER TABLE public.guild_tactics ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read guild_tactics" ON public.guild_tactics;
    CREATE POLICY "Allow public read guild_tactics" ON public.guild_tactics FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public write guild_tactics" ON public.guild_tactics;
    CREATE POLICY "Allow public write guild_tactics" ON public.guild_tactics FOR ALL USING (true);
END $$;

-- 3. เปิดใช้งาน Supabase Realtime (เพื่อให้เห็นหมุดที่ปักพร้อมกันสดๆ ข้ามเครื่อง)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'guild_tactics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_tactics;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- ข้ามหาก publication เปิดอยู่แล้ว
END $$;

-- 4. บรรจุแถวเริ่มต้นสำหรับ Guild ID 1 (Moonz) และ ID 2 (TUMDOOD)
INSERT INTO public.guild_tactics (id, plans, updated_at)
VALUES 
    (1, '[]'::jsonb, NOW()),
    (2, '[]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

