-- ==============================================================================
-- MIGRATION SCRIPT: SEPARATE TABLES ARCHITECTURE FOR TUMDOOD GUILD MANAGER
-- ==============================================================================
-- วิธีใช้งาน:
-- 1. คัดลอกโค้ดทั้งหมดนี้ไปวางในหน้า Dashboard ของ Supabase:
--    -> ไปที่โปรเจกต์ของคุณ -> เมนู SQL Editor (ด้านซ้าย) -> New Query
-- 2. กดปุ่ม "Run" เพื่อสร้างตารางทั้งหมด และคัดลอกข้อมูลเดิม 149 สมาชิก & 111 ปาร์ตี้เข้าตารางใหม่ทันที
-- ==============================================================================

-- 0. ล้างตารางเดิมที่อาจเคยสร้างค้างไว้แบบเก่า เพื่อป้องกันปัญหาคอลัมน์ไม่ตรงกัน
DROP TABLE IF EXISTS public.guild_config CASCADE;
DROP TABLE IF EXISTS public.guild_auth CASCADE;
DROP TABLE IF EXISTS public.guild_members CASCADE;
DROP TABLE IF EXISTS public.guild_tactical_teams CASCADE;
DROP TABLE IF EXISTS public.guild_tactical_parties CASCADE;
DROP TABLE IF EXISTS public.auction_rounds CASCADE;
DROP TABLE IF EXISTS public.auction_items CASCADE;
DROP TABLE IF EXISTS public.queue_lists CASCADE;

-- 1. ตารางตั้งค่าข้อมูลกิลด์ทั่วไป (Guild Info & Timestamp)
CREATE TABLE public.guild_config (
    id INT PRIMARY KEY DEFAULT 1,
    guild_name TEXT NOT NULL DEFAULT 'TUMDOOD',
    file_timestamp TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางจัดการรหัสผ่านความปลอดภัย (Auth PIN)
CREATE TABLE public.guild_auth (
    id INT PRIMARY KEY DEFAULT 1,
    pin TEXT NOT NULL DEFAULT 'TUMDOOD',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางสมาชิกกิลด์ (Guild Members & Full Data)
CREATE TABLE public.guild_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    job TEXT DEFAULT '',
    lv INT DEFAULT 0, 
    gear BIGINT DEFAULT 0,
    position TEXT DEFAULT '',
    title TEXT DEFAULT '',
    status TEXT DEFAULT 'ready',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางทีมจัดทัพ (Tactical Teams: GVG, Siege, Polarity)
CREATE TABLE public.guild_tactical_teams (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'gvg', 'siege', 'polarity'
    name TEXT NOT NULL DEFAULT '',
    field TEXT DEFAULT 'main', -- 'main' or 'sub'
    color TEXT DEFAULT 'rose',
    display_order INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางปาร์ตี้จัดทัพ (Tactical Parties: GVG, Siege, Polarity, Preset)
CREATE TABLE public.guild_tactical_parties (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'gvg', 'siege', 'polarity', 'preset'
    name TEXT NOT NULL DEFAULT '',
    team_id TEXT,
    lane TEXT DEFAULT 'lane_mid',
    slots JSONB DEFAULT '[null, null, null, null, null]'::jsonb,
    preset_id TEXT DEFAULT NULL,
    display_order INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางรอบการประมูล (Auction Rounds)
CREATE TABLE public.auction_rounds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    date TEXT DEFAULT '',
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'archived'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ตารางไอเทมประมูล (Auction Items & Bids)
CREATE TABLE public.auction_items (
    id TEXT PRIMARY KEY,
    round_id TEXT,
    name TEXT DEFAULT '',
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'ended', 'cancelled'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางระบบคิวรับไอเทม/คิวทีม (Queue Lists & Entries)
CREATE TABLE public.queue_lists (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'closed', 'scheduled'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM SPEED (สร้าง Index เพื่อให้การค้นหาเร็วที่สุด)
-- ==============================================================================
CREATE INDEX idx_members_name ON public.guild_members(name);
CREATE INDEX idx_members_job ON public.guild_members(job);
CREATE INDEX idx_members_gear ON public.guild_members(gear DESC);
CREATE INDEX idx_tactical_teams_cat ON public.guild_tactical_teams(category);
CREATE INDEX idx_tactical_parties_cat ON public.guild_tactical_parties(category);
CREATE INDEX idx_tactical_parties_team ON public.guild_tactical_parties(team_id);
CREATE INDEX idx_auction_items_round ON public.auction_items(round_id);
CREATE INDEX idx_auction_items_status ON public.auction_items(status);

-- ==============================================================================
-- RLS POLICIES (กำหนดสิทธิ์ให้อ่าน/เขียนได้ทั้ง Anonymous และ Authenticated)
-- ==============================================================================
ALTER TABLE public.guild_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_tactical_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_tactical_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_lists ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'guild_config', 'guild_auth', 'guild_members',
        'guild_tactical_teams', 'guild_tactical_parties',
        'auction_rounds', 'auction_items', 'queue_lists'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Allow public full access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
        EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role;', tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- REALTIME REPLICATION (เปิดให้ส่งข้อมูล Realtime ข้ามแท็บ/อุปกรณ์ทันที)
-- ==============================================================================
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'guild_config', 'guild_auth', 'guild_members',
        'guild_tactical_teams', 'guild_tactical_parties',
        'auction_rounds', 'auction_items', 'queue_lists'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END LOOP;
END $$;

-- ==============================================================================
-- AUTOMATIC DATA MIGRATION (คัดลอกข้อมูลจาก guild_state id=2 เข้าตารางใหม่ทันที)
-- ==============================================================================
DO $$
DECLARE
    v_record RECORD;
    v_members JSONB;
    v_parties JSONB;
    v_member JSONB;
    v_party JSONB;
    v_auth_pin TEXT := 'TUMDOOD';
    v_siege_teams JSONB;
    v_pol_teams JSONB;
    v_auction_rounds JSONB;
    v_auction_items JSONB;
    v_queue_lists JSONB;
    v_idx INT;
BEGIN
    SELECT * INTO v_record FROM public.guild_state WHERE id = 2 LIMIT 1;
    IF NOT FOUND THEN
        SELECT * INTO v_record FROM public.guild_state ORDER BY id DESC LIMIT 1;
    END IF;

    IF FOUND THEN
        -- 1. ย้าย Guild Config
        INSERT INTO public.guild_config (id, guild_name, file_timestamp, updated_at)
        VALUES (1, COALESCE(v_record.guild_name, 'TUMDOOD'), COALESCE(v_record.file_timestamp, ''), NOW())
        ON CONFLICT (id) DO UPDATE SET
            guild_name = EXCLUDED.guild_name,
            file_timestamp = EXCLUDED.file_timestamp,
            updated_at = NOW();

        v_members := v_record.members::jsonb;
        v_parties := v_record.parties::jsonb;

        -- 2. ค้นหา Auth PIN จาก parties (__guild_auth_config__)
        IF v_parties IS NOT NULL AND jsonb_typeof(v_parties) = 'array' THEN
            FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties) LOOP
                IF (v_party->>'id') = '__guild_auth_config__' AND (v_party->>'pin') IS NOT NULL THEN
                    v_auth_pin := v_party->>'pin';
                END IF;
            END LOOP;
        END IF;

        INSERT INTO public.guild_auth (id, pin, updated_at)
        VALUES (1, v_auth_pin, NOW())
        ON CONFLICT (id) DO UPDATE SET
            pin = EXCLUDED.pin,
            updated_at = NOW();

        -- 3. ย้ายข้อมูลสมาชิก Guild Members
        IF v_members IS NOT NULL AND jsonb_typeof(v_members) = 'array' THEN
            FOR v_member IN SELECT * FROM jsonb_array_elements(v_members) LOOP
                IF (v_member->>'id') IS NOT NULL THEN
                    INSERT INTO public.guild_members (
                        id, name, job, lv, gear, position, title, status, data, updated_at
                    ) VALUES (
                        v_member->>'id',
                        COALESCE(v_member->>'name', 'ไม่ระบุชื่อ'),
                        COALESCE(v_member->>'job', ''),
                        COALESCE((v_member->>'lv')::int, 0),
                        COALESCE((v_member->>'gear')::bigint, 0),
                        COALESCE(v_member->>'position', ''),
                        COALESCE(v_member->>'title', ''),
                        COALESCE(v_member->>'status', 'ready'),
                        v_member,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        job = EXCLUDED.job,
                        lv = EXCLUDED.lv,
                        gear = EXCLUDED.gear,
                        position = EXCLUDED.position,
                        title = EXCLUDED.title,
                        status = EXCLUDED.status,
                        data = EXCLUDED.data,
                        updated_at = NOW();
                END IF;
            END LOOP;
        END IF;

        -- 4. ย้ายทีมและปาร์ตี้ Tactical Teams & Parties
        IF v_parties IS NOT NULL AND jsonb_typeof(v_parties) = 'array' THEN
            v_idx := 0;
            FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties) LOOP
                v_idx := v_idx + 1;
                
                IF (v_party->>'id') = '__siege_teams_config__' THEN
                    v_siege_teams := v_party->'teams';
                ELSIF (v_party->>'id') = '__polarity_teams_config__' THEN
                    v_pol_teams := v_party->'teams';
                ELSIF (v_party->>'id') = '__auction_items_config__' THEN
                    v_auction_rounds := v_party->'rounds';
                    v_auction_items := v_party->'items';
                ELSIF (v_party->>'id') = '__queue_lists_config__' THEN
                    v_queue_lists := v_party->'lists';
                ELSIF (v_party->>'id') LIKE '__%' THEN
                    NULL;
                ELSE
                    -- ย้าย Party
                    INSERT INTO public.guild_tactical_parties (
                        id, category, name, team_id, lane, slots, preset_id, display_order, updated_at
                    ) VALUES (
                        v_party->>'id',
                        COALESCE(v_party->>'category', 'gvg'),
                        COALESCE(v_party->>'name', 'ปาร์ตี้'),
                        v_party->>'teamId',
                        COALESCE(v_party->>'lane', 'lane_mid'),
                        COALESCE(v_party->'slots', '[null, null, null, null, null]'::jsonb),
                        v_party->>'presetId',
                        v_idx,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        category = EXCLUDED.category,
                        name = EXCLUDED.name,
                        team_id = EXCLUDED.team_id,
                        lane = EXCLUDED.lane,
                        slots = EXCLUDED.slots,
                        preset_id = EXCLUDED.preset_id,
                        display_order = EXCLUDED.display_order,
                        updated_at = NOW();

                    -- GVG Teams
                    IF (v_party->>'category') IS NULL OR (v_party->>'category') = 'gvg' THEN
                        IF (v_party->>'teamId') IS NOT NULL THEN
                            INSERT INTO public.guild_tactical_teams (
                                id, category, name, field, color, display_order, updated_at
                            ) VALUES (
                                v_party->>'teamId',
                                'gvg',
                                COALESCE(v_party->>'teamName', 'ทีม ' || (v_party->>'teamId')),
                                COALESCE(v_party->>'teamField', 'main'),
                                COALESCE(v_party->>'teamColor', 'rose'),
                                0,
                                NOW()
                            )
                            ON CONFLICT (id) DO UPDATE SET
                                name = COALESCE(EXCLUDED.name, public.guild_tactical_teams.name),
                                field = COALESCE(EXCLUDED.field, public.guild_tactical_teams.field),
                                color = COALESCE(EXCLUDED.color, public.guild_tactical_teams.color);
                        END IF;
                    END IF;
                END IF;
            END LOOP;

            -- Siege Teams
            IF v_siege_teams IS NOT NULL AND jsonb_typeof(v_siege_teams) = 'array' THEN
                FOR v_party IN SELECT * FROM jsonb_array_elements(v_siege_teams) LOOP
                    INSERT INTO public.guild_tactical_teams (
                        id, category, name, field, color, display_order, updated_at
                    ) VALUES (
                        v_party->>'id',
                        'siege',
                        COALESCE(v_party->>'name', 'ทีมปราสาท'),
                        COALESCE(v_party->>'field', 'main'),
                        COALESCE(v_party->>'color', 'sky'),
                        0,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        field = EXCLUDED.field,
                        color = EXCLUDED.color,
                        updated_at = NOW();
                END LOOP;
            END IF;

            -- Polarity Teams
            IF v_pol_teams IS NOT NULL AND jsonb_typeof(v_pol_teams) = 'array' THEN
                FOR v_party IN SELECT * FROM jsonb_array_elements(v_pol_teams) LOOP
                    INSERT INTO public.guild_tactical_teams (
                        id, category, name, field, color, display_order, updated_at
                    ) VALUES (
                        v_party->>'id',
                        'polarity',
                        COALESCE(v_party->>'name', 'ทีม Polarity'),
                        COALESCE(v_party->>'field', 'main'),
                        COALESCE(v_party->>'color', 'amber'),
                        0,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        field = EXCLUDED.field,
                        color = EXCLUDED.color,
                        updated_at = NOW();
                END LOOP;
            END IF;

            -- Auction Rounds
            IF v_auction_rounds IS NOT NULL AND jsonb_typeof(v_auction_rounds) = 'array' THEN
                FOR v_party IN SELECT * FROM jsonb_array_elements(v_auction_rounds) LOOP
                    INSERT INTO public.auction_rounds (
                        id, name, date, status, data, updated_at
                    ) VALUES (
                        v_party->>'id',
                        COALESCE(v_party->>'name', 'รอบประมูล'),
                        COALESCE(v_party->>'date', ''),
                        COALESCE(v_party->>'status', 'scheduled'),
                        v_party,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        date = EXCLUDED.date,
                        status = EXCLUDED.status,
                        data = EXCLUDED.data,
                        updated_at = NOW();
                END LOOP;
            END IF;

            -- Auction Items
            IF v_auction_items IS NOT NULL AND jsonb_typeof(v_auction_items) = 'array' THEN
                FOR v_party IN SELECT * FROM jsonb_array_elements(v_auction_items) LOOP
                    INSERT INTO public.auction_items (
                        id, round_id, name, status, data, updated_at
                    ) VALUES (
                        v_party->>'id',
                        v_party->>'roundId',
                        COALESCE(v_party->>'accessoryName', 'ไอเทม'),
                        COALESCE(v_party->>'status', 'pending'),
                        v_party,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        round_id = EXCLUDED.round_id,
                        name = EXCLUDED.name,
                        status = EXCLUDED.status,
                        data = EXCLUDED.data,
                        updated_at = NOW();
                END LOOP;
            END IF;

            -- Queue Lists
            IF v_queue_lists IS NOT NULL AND jsonb_typeof(v_queue_lists) = 'array' THEN
                FOR v_party IN SELECT * FROM jsonb_array_elements(v_queue_lists) LOOP
                    INSERT INTO public.queue_lists (
                        id, title, status, data, updated_at
                    ) VALUES (
                        v_party->>'id',
                        COALESCE(v_party->>'title', 'รายการคิว'),
                        COALESCE(v_party->>'status', 'open'),
                        v_party,
                        NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        status = EXCLUDED.status,
                        data = EXCLUDED.data,
                        updated_at = NOW();
                END LOOP;
            END IF;

        END IF;

    END IF;
END $$;
