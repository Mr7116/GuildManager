-- ==============================================================================
-- 🚀 SUITE: Atomic Database Functions สำหรับทุกฟังก์ชันในระบบ Moonz Guild Manager
-- (Complete Concurrency Control with Row-Level Locking in PostgreSQL)
-- ==============================================================================
-- ป้องกัน Race Condition และการเขียนทับกัน 100% เมื่อมีสมาชิกหลายคนกดใช้งานพร้อมกัน
-- วิธีใช้: คัดลอกโค้ดทั้งหมดนี้ไปวางและกด RUN ใน Supabase SQL Editor ได้ทันทีครับ
-- ==============================================================================

-- ==============================================================================
-- หมวดที่ 1: ระบบคิวลงดันเจี้ยน (Queue Atomic Functions)
-- ==============================================================================

-- 1.1 กดต่อคิวแบบ Atomic
CREATE OR REPLACE FUNCTION public.join_queue_atomic(
    p_guild_id INT,
    p_queue_id TEXT,
    p_member_id TEXT,
    p_member_name TEXT,
    p_member_job TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_lists JSONB;
    v_new_lists JSONB := '[]'::jsonb;
    v_q JSONB;
    v_entries JSONB;
    v_found BOOLEAN := false;
    v_status TEXT;
    v_max_cap INT;
    v_entry_id TEXT;
    v_joined_at TEXT;
    v_new_entry JSONB;
    v_position INT := 0;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_queues
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.guild_queues (id, lists, updated_at)
        VALUES (p_guild_id, '[]'::jsonb, NOW())
        RETURNING * INTO v_row;
    END IF;

    v_lists := COALESCE(v_row.lists, '[]'::jsonb);

    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_status := COALESCE(v_q->>'status', 'open');

            IF v_status = 'closed' THEN
                RETURN jsonb_build_object('success', false, 'message', 'คิวนี้ปิดรับแล้ว');
            END IF;

            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);

            IF EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(v_entries) e 
                WHERE e->>'memberId' = p_member_id
            ) THEN
                RETURN jsonb_build_object('success', false, 'message', 'คุณอยู่ในคิวนี้แล้ว');
            END IF;

            IF (v_q->>'maxCapacity') IS NOT NULL AND (v_q->>'maxCapacity')::int > 0 THEN
                v_max_cap := (v_q->>'maxCapacity')::int;
                IF jsonb_array_length(v_entries) >= v_max_cap THEN
                    RETURN jsonb_build_object('success', false, 'message', 'คิวเต็มตามจำนวนที่กำหนดแล้ว (' || v_max_cap || ' คน)');
                END IF;
            END IF;

            v_entry_id := 'qentry_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 6);
            v_joined_at := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
            v_position := jsonb_array_length(v_entries) + 1;

            v_new_entry := jsonb_build_object(
                'id', v_entry_id,
                'memberId', p_member_id,
                'memberName', p_member_name,
                'memberJob', p_member_job,
                'joinedAt', v_joined_at,
                'note', p_note
            );

            v_entries := v_entries || jsonb_build_array(v_new_entry);
            v_q := jsonb_set(v_q, '{entries}', v_entries);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(v_joined_at));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคิวที่ระบุ หรือคิวอาจถูกลบไปแล้ว');
    END IF;

    UPDATE public.guild_queues
    SET lists = v_new_lists, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'เข้าร่วมคิวสำเร็จ! ลำดับที่ ' || v_position,
        'position', v_position,
        'entry', v_new_entry,
        'lists', v_new_lists
    );
END;
$$;

-- 1.2 สมาชิกกดยกเลิกคิวตนเองแบบ Atomic
CREATE OR REPLACE FUNCTION public.leave_queue_atomic(
    p_guild_id INT,
    p_queue_id TEXT,
    p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_lists JSONB;
    v_new_lists JSONB := '[]'::jsonb;
    v_q JSONB;
    v_entries JSONB;
    v_filtered JSONB;
    v_found BOOLEAN := false;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_queues
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลคิว');
    END IF;

    v_lists := COALESCE(v_row.lists, '[]'::jsonb);

    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);

            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_filtered
            FROM jsonb_array_elements(v_entries) e
            WHERE e->>'memberId' <> p_member_id;

            v_q := jsonb_set(v_q, '{entries}', v_filtered);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคิว');
    END IF;

    UPDATE public.guild_queues
    SET lists = v_new_lists, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ออกจากคิวเรียบร้อย',
        'lists', v_new_lists
    );
END;
$$;

-- 1.3 แอดมินลบ Entry คิวแบบ Atomic
CREATE OR REPLACE FUNCTION public.remove_queue_entry_atomic(
    p_guild_id INT,
    p_queue_id TEXT,
    p_entry_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_lists JSONB;
    v_new_lists JSONB := '[]'::jsonb;
    v_q JSONB;
    v_entries JSONB;
    v_filtered JSONB;
    v_found BOOLEAN := false;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_queues
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลคิว');
    END IF;

    v_lists := COALESCE(v_row.lists, '[]'::jsonb);

    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);

            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_filtered
            FROM jsonb_array_elements(v_entries) e
            WHERE e->>'id' <> p_entry_id;

            v_q := jsonb_set(v_q, '{entries}', v_filtered);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคิว');
    END IF;

    UPDATE public.guild_queues
    SET lists = v_new_lists, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลบผู้ต่อคิวเรียบร้อย',
        'lists', v_new_lists
    );
END;
$$;

-- 1.4 สลับสถานะผ่าน/ไม่ผ่านของคนในคิว (Toggle Completed) แบบ Atomic
CREATE OR REPLACE FUNCTION public.toggle_queue_entry_atomic(
    p_guild_id INT,
    p_queue_id TEXT,
    p_entry_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_lists JSONB;
    v_new_lists JSONB := '[]'::jsonb;
    v_q JSONB;
    v_entries JSONB;
    v_new_entries JSONB;
    v_e JSONB;
    v_found BOOLEAN := false;
    v_now_completed BOOLEAN := false;
    v_completed_at TEXT;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_queues
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลคิว');
    END IF;

    v_lists := COALESCE(v_row.lists, '[]'::jsonb);

    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);
            v_new_entries := '[]'::jsonb;

            FOR v_e IN SELECT * FROM jsonb_array_elements(v_entries)
            LOOP
                IF v_e->>'id' = p_entry_id THEN
                    v_now_completed := NOT COALESCE((v_e->>'isCompleted')::boolean, false);
                    v_e := jsonb_set(v_e, '{isCompleted}', to_jsonb(v_now_completed));
                    IF v_now_completed THEN
                        v_completed_at := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
                        v_e := jsonb_set(v_e, '{completedAt}', to_jsonb(v_completed_at));
                    ELSE
                        v_e := v_e - 'completedAt';
                    END IF;
                END IF;
                v_new_entries := v_new_entries || jsonb_build_array(v_e);
            END LOOP;

            v_q := jsonb_set(v_q, '{entries}', v_new_entries);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคิวนี้');
    END IF;

    UPDATE public.guild_queues
    SET lists = v_new_lists, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'อัปเดตสถานะผ่านเรียบร้อย',
        'isCompleted', v_now_completed,
        'lists', v_new_lists
    );
END;
$$;

-- ==============================================================================
-- หมวดที่ 2: ระบบประมูลและชิงไอเทม (Auction Atomic Functions)
-- ==============================================================================

-- 2.1 กดลงชื่อเข้าร่วมประมูลแบบ Atomic
CREATE OR REPLACE FUNCTION public.join_auction_atomic(
    p_guild_id INT,
    p_auction_id TEXT,
    p_member_id TEXT,
    p_member_name TEXT,
    p_member_job TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_items JSONB;
    v_new_items JSONB := '[]'::jsonb;
    v_item JSONB;
    v_entries JSONB;
    v_found BOOLEAN := false;
    v_status TEXT;
    v_max_entries INT;
    v_cat TEXT;
    v_allow_multi BOOLEAN;
    v_entry_id TEXT;
    v_registered_at TEXT;
    v_new_entry JSONB;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_auctions
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลการประมูลของกิลด์นี้');
    END IF;

    v_items := COALESCE(v_row.items, '[]'::jsonb);

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        IF v_item->>'id' = p_auction_id THEN
            v_found := true;
            v_status := COALESCE(v_item->>'status', 'active');

            IF v_status <> 'active' THEN
                RETURN jsonb_build_object('success', false, 'message', 'รายการประมูลนี้ไม่ได้เปิดรับลงชื่อ');
            END IF;

            v_entries := COALESCE(v_item->'entries', '[]'::jsonb);
            v_cat := COALESCE(v_item->>'itemCategory', '');
            -- Title หรือ Chest/Pack อนุญาตให้ลงหลายสิทธิ์ได้
            v_allow_multi := (v_cat = 'title' OR v_cat = 'chest');

            IF NOT v_allow_multi AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(v_entries) e
                WHERE e->>'memberId' = p_member_id
            ) THEN
                RETURN jsonb_build_object('success', false, 'message', 'คุณลงชื่อในรายการนี้แล้ว (จำกัด 1 สิทธิ์)');
            END IF;

            IF (v_item->>'maxEntries') IS NOT NULL AND (v_item->>'maxEntries')::int > 0 THEN
                v_max_entries := (v_item->>'maxEntries')::int;
                IF jsonb_array_length(v_entries) >= v_max_entries THEN
                    RETURN jsonb_build_object('success', false, 'message', 'จำนวนผู้ลงชื่อเต็มตามที่กำหนดแล้ว (' || v_max_entries || ' สิทธิ์)');
                END IF;
            END IF;

            v_entry_id := 'entry_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 4);
            v_registered_at := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

            v_new_entry := jsonb_build_object(
                'id', v_entry_id,
                'memberId', p_member_id,
                'memberName', p_member_name,
                'memberJob', p_member_job,
                'registeredAt', v_registered_at
            );

            v_entries := v_entries || jsonb_build_array(v_new_entry);
            v_item := jsonb_set(v_item, '{entries}', v_entries);
        END IF;

        v_new_items := v_new_items || jsonb_build_array(v_item);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรายการประมูลนี้');
    END IF;

    UPDATE public.guild_auctions
    SET items = v_new_items, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลงชื่อเข้าร่วมประมูลสำเร็จ!',
        'entry', v_new_entry,
        'items', v_new_items
    );
END;
$$;

-- 2.2 ยกเลิกการลงชื่อประมูลของสมาชิกแบบ Atomic
CREATE OR REPLACE FUNCTION public.leave_auction_atomic(
    p_guild_id INT,
    p_auction_id TEXT,
    p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_items JSONB;
    v_new_items JSONB := '[]'::jsonb;
    v_item JSONB;
    v_entries JSONB;
    v_filtered_entries JSONB;
    v_found BOOLEAN := false;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_auctions
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลการประมูล');
    END IF;

    v_items := COALESCE(v_row.items, '[]'::jsonb);

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        IF v_item->>'id' = p_auction_id THEN
            v_found := true;
            v_entries := COALESCE(v_item->'entries', '[]'::jsonb);
            
            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_filtered_entries
            FROM jsonb_array_elements(v_entries) e
            WHERE e->>'memberId' <> p_member_id;

            v_item := jsonb_set(v_item, '{entries}', v_filtered_entries);
        END IF;

        v_new_items := v_new_items || jsonb_build_array(v_item);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรายการประมูล');
    END IF;

    UPDATE public.guild_auctions
    SET items = v_new_items, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ยกเลิกการลงชื่อสำเร็จ',
        'items', v_new_items
    );
END;
$$;

-- 2.3 แอดมินลบสิทธิ์ลงชื่อรายบุคคล (Entry) แบบ Atomic
CREATE OR REPLACE FUNCTION public.remove_auction_entry_atomic(
    p_guild_id INT,
    p_auction_id TEXT,
    p_entry_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_items JSONB;
    v_new_items JSONB := '[]'::jsonb;
    v_item JSONB;
    v_entries JSONB;
    v_filtered_entries JSONB;
    v_found BOOLEAN := false;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_auctions
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลการประมูล');
    END IF;

    v_items := COALESCE(v_row.items, '[]'::jsonb);

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        IF v_item->>'id' = p_auction_id THEN
            v_found := true;
            v_entries := COALESCE(v_item->'entries', '[]'::jsonb);
            
            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_filtered_entries
            FROM jsonb_array_elements(v_entries) e
            WHERE e->>'id' <> p_entry_id;

            v_item := jsonb_set(v_item, '{entries}', v_filtered_entries);
        END IF;

        v_new_items := v_new_items || jsonb_build_array(v_item);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรายการประมูล');
    END IF;

    UPDATE public.guild_auctions
    SET items = v_new_items, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลบสิทธิ์การลงชื่อเรียบร้อย',
        'items', v_new_items
    );
END;
$$;

-- 2.4 เสนอราคาประมูล (Place Bid) แบบ Atomic ป้องกันการเคาะราคาชนกัน
CREATE OR REPLACE FUNCTION public.place_bid_atomic(
    p_guild_id INT,
    p_auction_id TEXT,
    p_member_id TEXT,
    p_member_name TEXT,
    p_member_job TEXT DEFAULT NULL,
    p_amount BIGINT DEFAULT 0,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_items JSONB;
    v_new_items JSONB := '[]'::jsonb;
    v_item JSONB;
    v_bids JSONB;
    v_found BOOLEAN := false;
    v_status TEXT;
    v_current_price BIGINT;
    v_start_price BIGINT;
    v_min_increment BIGINT;
    v_min_allowed BIGINT;
    v_bid_id TEXT;
    v_timestamp TEXT;
    v_new_bid JSONB;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_auctions
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลการประมูลของกิลด์นี้');
    END IF;

    v_items := COALESCE(v_row.items, '[]'::jsonb);

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        IF v_item->>'id' = p_auction_id THEN
            v_found := true;
            v_status := COALESCE(v_item->>'status', 'active');

            IF v_status <> 'active' THEN
                RETURN jsonb_build_object('success', false, 'message', 'การประมูลนี้สิ้นสุดหรือถูกยกเลิกแล้ว');
            END IF;

            v_bids := COALESCE(v_item->'bids', '[]'::jsonb);
            v_start_price := COALESCE((v_item->>'startPrice')::bigint, 0);
            v_current_price := COALESCE((v_item->>'currentPrice')::bigint, v_start_price);
            v_min_increment := COALESCE((v_item->>'minIncrement')::bigint, 100);

            IF jsonb_array_length(v_bids) = 0 THEN
                v_min_allowed := v_start_price;
            ELSE
                v_min_allowed := v_current_price + v_min_increment;
            END IF;

            IF p_amount < v_min_allowed THEN
                RETURN jsonb_build_object(
                    'success', false, 
                    'message', 'มีผู้เสนอราคาสูงกว่าแล้ว ต้องเสนอราคาอย่างน้อย ' || to_char(v_min_allowed, 'FM999,999,999,999') || ' หน่วย'
                );
            END IF;

            v_bid_id := 'bid_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 4);
            v_timestamp := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

            v_new_bid := jsonb_build_object(
                'id', v_bid_id,
                'memberId', p_member_id,
                'memberName', p_member_name,
                'memberJob', p_member_job,
                'amount', p_amount,
                'timestamp', v_timestamp,
                'note', p_note
            );

            v_bids := jsonb_build_array(v_new_bid) || v_bids;
            v_item := jsonb_set(v_item, '{bids}', v_bids);
            v_item := jsonb_set(v_item, '{currentPrice}', to_jsonb(p_amount));
            v_item := jsonb_set(v_item, '{winnerMemberId}', to_jsonb(p_member_id));
            v_item := jsonb_set(v_item, '{winnerMemberName}', to_jsonb(p_member_name));
            v_item := jsonb_set(v_item, '{winnerMemberJob}', to_jsonb(p_member_job));
        END IF;

        v_new_items := v_new_items || jsonb_build_array(v_item);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรายการประมูลนี้');
    END IF;

    UPDATE public.guild_auctions
    SET items = v_new_items, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'เสนอราคา ' || to_char(p_amount, 'FM999,999,999,999') || ' หน่วย สำเร็จ!',
        'items', v_new_items,
        'bid', v_new_bid
    );
END;
$$;

-- ==============================================================================
-- หมวดที่ 3: ระบบแจ้งลากิลด์วอร์ออนไลน์ (Leave War Atomic Functions)
-- ==============================================================================

-- 3.1 สมาชิกส่งใบลาวอร์แบบ Atomic
CREATE OR REPLACE FUNCTION public.submit_leave_atomic(
    p_guild_id INT,
    p_member_id TEXT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_members JSONB;
    v_new_members JSONB := '[]'::jsonb;
    v_m JSONB;
    v_found BOOLEAN := false;
    v_now TEXT;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_members
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลสมาชิกกิลด์');
    END IF;

    v_members := COALESCE(v_row.members, '[]'::jsonb);
    v_now := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    FOR v_m IN SELECT * FROM jsonb_array_elements(v_members)
    LOOP
        IF v_m->>'id' = p_member_id THEN
            v_found := true;
            v_m := jsonb_set(v_m, '{status}', '"leave"'::jsonb);
            v_m := jsonb_set(v_m, '{leaveReason}', to_jsonb(p_reason));
            v_m := jsonb_set(v_m, '{updatedAt}', to_jsonb(v_now));
        END IF;
        v_new_members := v_new_members || jsonb_build_array(v_m);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบสมาชิกรายนี้');
    END IF;

    UPDATE public.guild_members
    SET members = v_new_members, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'บันทึกการลาสำเร็จ!',
        'members', v_new_members
    );
END;
$$;

-- 3.2 สมาชิกยกเลิกการลาวอร์แบบ Atomic
CREATE OR REPLACE FUNCTION public.cancel_leave_atomic(
    p_guild_id INT,
    p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_members JSONB;
    v_new_members JSONB := '[]'::jsonb;
    v_m JSONB;
    v_found BOOLEAN := false;
    v_now TEXT;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_members
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลสมาชิกกิลด์');
    END IF;

    v_members := COALESCE(v_row.members, '[]'::jsonb);
    v_now := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    FOR v_m IN SELECT * FROM jsonb_array_elements(v_members)
    LOOP
        IF v_m->>'id' = p_member_id THEN
            v_found := true;
            v_m := jsonb_set(v_m, '{status}', '"ready"'::jsonb);
            v_m := v_m - 'leaveReason';
            v_m := jsonb_set(v_m, '{updatedAt}', to_jsonb(v_now));
        END IF;
        v_new_members := v_new_members || jsonb_build_array(v_m);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบสมาชิกรายนี้');
    END IF;

    UPDATE public.guild_members
    SET members = v_new_members, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ยกเลิกการลาสำเร็จ กลับมาพร้อมรบ!',
        'members', v_new_members
    );
END;
$$;

-- ==============================================================================
-- หมวดที่ 4: ระบบรายชื่อสมาชิกกิลด์ (Roster Atomic Functions)
-- ==============================================================================

-- 4.1 เพิ่มหรือแก้ไขสมาชิกรายบุคคลแบบ Atomic
CREATE OR REPLACE FUNCTION public.upsert_member_atomic(
    p_guild_id INT,
    p_member JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_members JSONB;
    v_new_members JSONB := '[]'::jsonb;
    v_m JSONB;
    v_found BOOLEAN := false;
    v_member_id TEXT;
    v_now TEXT;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_members
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.guild_members (id, members, updated_at)
        VALUES (p_guild_id, '[]'::jsonb, NOW())
        RETURNING * INTO v_row;
    END IF;

    v_members := COALESCE(v_row.members, '[]'::jsonb);
    v_member_id := p_member->>'id';
    v_now := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    FOR v_m IN SELECT * FROM jsonb_array_elements(v_members)
    LOOP
        IF v_m->>'id' = v_member_id THEN
            v_found := true;
            v_new_members := v_new_members || jsonb_build_array(p_member || jsonb_build_object('updatedAt', v_now));
        ELSE
            v_new_members := v_new_members || jsonb_build_array(v_m);
        END IF;
    END LOOP;

    IF NOT v_found THEN
        v_new_members := v_new_members || jsonb_build_array(p_member || jsonb_build_object('updatedAt', v_now));
    END IF;

    UPDATE public.guild_members
    SET members = v_new_members, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'บันทึกข้อมูลสมาชิกเรียบร้อย',
        'members', v_new_members
    );
END;
$$;

-- 4.2 ลบสมาชิกออกจากระบบแบบ Atomic
CREATE OR REPLACE FUNCTION public.delete_member_atomic(
    p_guild_id INT,
    p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row RECORD;
    v_members JSONB;
    v_new_members JSONB;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_members
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลสมาชิก');
    END IF;

    v_members := COALESCE(v_row.members, '[]'::jsonb);

    SELECT COALESCE(jsonb_agg(m), '[]'::jsonb) INTO v_new_members
    FROM jsonb_array_elements(v_members) m
    WHERE m->>'id' <> p_member_id;

    UPDATE public.guild_members
    SET members = v_new_members, updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลบสมาชิกเรียบร้อย',
        'members', v_new_members
    );
END;
$$;

-- ==============================================================================
-- หมวดที่ 5: ระบบจัดผังทัพกิลด์วอร์ (Tactical Squads / GVG / Siege / Polarity)
-- ==============================================================================

-- 5.1 จัดคนลง Slot ปาร์ตี้แบบ Atomic (ถอดคนออกจากตำแหน่งเดิมอัตโนมัติ ไม่ซ้ำตี้)
CREATE OR REPLACE FUNCTION public.assign_slot_atomic(
    p_guild_id INT,
    p_mode TEXT,       -- 'gvg', 'siege', หรือ 'polarity'
    p_party_id TEXT,
    p_slot_idx INT,    -- 0 ถึง 4
    p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_table TEXT;
    v_row RECORD;
    v_parties JSONB;
    v_new_parties JSONB := '[]'::jsonb;
    v_p JSONB;
    v_slots JSONB;
    v_s_idx INT;
    v_slot_val TEXT;
    v_found BOOLEAN := false;
BEGIN
    IF p_mode = 'gvg' THEN
        v_table := 'guild_gvg';
    ELSIF p_mode = 'siege' THEN
        v_table := 'guild_siege';
    ELSIF p_mode = 'polarity' THEN
        v_table := 'guild_polarity';
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'โหมดไม่ถูกต้อง (ต้องเป็น gvg, siege หรือ polarity)');
    END IF;

    EXECUTE format('SELECT * FROM public.%I WHERE id = $1 FOR UPDATE', v_table)
    INTO v_row
    USING p_guild_id;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลผังทัพ');
    END IF;

    v_parties := COALESCE(v_row.parties, '[]'::jsonb);

    -- ล้างชื่อของสมาชิกคนนี้ออกจากช่องอื่นๆ ในผังทัพเดียวกันก่อน
    FOR v_p IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
        v_slots := COALESCE(v_p->'slots', '[null, null, null, null, null]'::jsonb);
        FOR v_s_idx IN 0..4 LOOP
            v_slot_val := v_slots->>v_s_idx;
            IF v_slot_val = p_member_id THEN
                v_slots := jsonb_set(v_slots, ARRAY[v_s_idx::text], 'null'::jsonb);
            END IF;
        END LOOP;

        IF v_p->>'id' = p_party_id THEN
            v_found := true;
            v_slots := jsonb_set(v_slots, ARRAY[p_slot_idx::text], to_jsonb(p_member_id));
        END IF;

        v_p := jsonb_set(v_p, '{slots}', v_slots);
        v_new_parties := v_new_parties || jsonb_build_array(v_p);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบปาร์ตี้เป้าหมาย');
    END IF;

    EXECUTE format('UPDATE public.%I SET parties = $1, updated_at = NOW() WHERE id = $2', v_table)
    USING v_new_parties, p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'จัดตำแหน่งสำเร็จ',
        'parties', v_new_parties
    );
END;
$$;

-- 5.2 ถอดคนออกจาก Slot ปาร์ตี้แบบ Atomic
CREATE OR REPLACE FUNCTION public.clear_slot_atomic(
    p_guild_id INT,
    p_mode TEXT,
    p_party_id TEXT,
    p_slot_idx INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_table TEXT;
    v_row RECORD;
    v_parties JSONB;
    v_new_parties JSONB := '[]'::jsonb;
    v_p JSONB;
    v_slots JSONB;
    v_found BOOLEAN := false;
BEGIN
    IF p_mode = 'gvg' THEN
        v_table := 'guild_gvg';
    ELSIF p_mode = 'siege' THEN
        v_table := 'guild_siege';
    ELSIF p_mode = 'polarity' THEN
        v_table := 'guild_polarity';
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'โหมดไม่ถูกต้อง');
    END IF;

    EXECUTE format('SELECT * FROM public.%I WHERE id = $1 FOR UPDATE', v_table)
    INTO v_row
    USING p_guild_id;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลผังทัพ');
    END IF;

    v_parties := COALESCE(v_row.parties, '[]'::jsonb);

    FOR v_p IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
        IF v_p->>'id' = p_party_id THEN
            v_found := true;
            v_slots := COALESCE(v_p->'slots', '[null, null, null, null, null]'::jsonb);
            v_slots := jsonb_set(v_slots, ARRAY[p_slot_idx::text], 'null'::jsonb);
            v_p := jsonb_set(v_p, '{slots}', v_slots);
        END IF;

        v_new_parties := v_new_parties || jsonb_build_array(v_p);
    END LOOP;

    EXECUTE format('UPDATE public.%I SET parties = $1, updated_at = NOW() WHERE id = $2', v_table)
    USING v_new_parties, p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลบสมาชิกออกจากตำแหน่งเรียบร้อย',
        'parties', v_new_parties
    );
END;
$$;

-- ==============================================================================
-- สิทธิ์การใช้งาน (GRANT EXECUTE to anon, authenticated, service_role)
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.join_queue_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leave_queue_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_queue_entry_atomic TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.join_auction_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leave_auction_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_auction_entry_atomic TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.submit_leave_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_leave_atomic TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.upsert_member_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_member_atomic TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.assign_slot_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.clear_slot_atomic TO anon, authenticated, service_role;

-- แจ้งสถานะการติดตั้ง
DO $$
BEGIN
    RAISE NOTICE '🎉 ติดตั้ง Atomic Database Functions สำหรับทุกฟังก์ชันในระบบเสร็จสมบูรณ์ 100%%';
END $$;

