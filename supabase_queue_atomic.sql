-- ==============================================================================
-- 🚀 ระบบจัดการคิวแบบ Atomic ป้องกันคนกดพร้อมกันแล้วแย่งกัน / เด้งออก 100%
-- (Atomic Queue Manager with Row-Level Locking in PostgreSQL)
-- ==============================================================================
-- วิธีใช้: คัดลอกโค้ดทั้งหมดนี้ไปกด Run ใน Supabase SQL Editor ได้ทันทีครับ

-- 1. ฟังก์ชันกดต่อคิวแบบ Atomic (ล็อกแถวด้วย FOR UPDATE จัดลำดับมิลลิวินาที ไม่มีการเขียนทับ)
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
    -- ล็อกแถวของกิลด์นี้ด้วย FOR UPDATE ป้องกัน Race Condition ระดับ Database
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

    -- วนลูปหา List คิวที่ต้องการต่อ
    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_status := COALESCE(v_q->>'status', 'open');

            IF v_status = 'closed' THEN
                RETURN jsonb_build_object('success', false, 'message', 'คิวนี้ปิดรับแล้ว');
            END IF;

            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);

            -- ตรวจสอบว่าสมาชิกคนนี้มีชื่ออยู่ในคิวแล้วหรือไม่
            IF EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(v_entries) e 
                WHERE e->>'memberId' = p_member_id
            ) THEN
                RETURN jsonb_build_object('success', false, 'message', 'คุณอยู่ในคิวนี้แล้ว');
            END IF;

            -- ตรวจสอบ Max Capacity (ถ้ามีการจำกัดจำนวนคน)
            IF (v_q->>'maxCapacity') IS NOT NULL AND (v_q->>'maxCapacity')::int > 0 THEN
                v_max_cap := (v_q->>'maxCapacity')::int;
                IF jsonb_array_length(v_entries) >= v_max_cap THEN
                    RETURN jsonb_build_object('success', false, 'message', 'คิวเต็มตามจำนวนที่กำหนดแล้ว (' || v_max_cap || ' คน)');
                END IF;
            END IF;

            -- สร้าง Entry ใหม่พร้อม Timestamp ระดับเสี้ยววินาทีของเซิร์ฟเวอร์
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

            -- นำ entry ใหม่ต่อท้าย
            v_entries := v_entries || jsonb_build_array(v_new_entry);
            v_q := jsonb_set(v_q, '{entries}', v_entries);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(v_joined_at));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบ List คิวที่ระบุ (อาจถูกปิดหรือลบแล้ว)');
    END IF;

    -- บันทึกกลับลงตาราง guild_queues
    UPDATE public.guild_queues
    SET lists = v_new_lists,
        updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'เข้าร่วมคิวสำเร็จ! (อันดับที่ #' || v_position || ')',
        'position', v_position,
        'entryId', v_entry_id,
        'joinedAt', v_joined_at
    );
END;
$$;


-- 2. ฟังก์ชันยกเลิกคิว / ออกจากคิวโดย Member ID แบบ Atomic
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
    v_filtered_entries JSONB;
    v_found BOOLEAN := false;
    v_removed BOOLEAN := false;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_queues
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลคิวของกิลด์นี้');
    END IF;

    v_lists := COALESCE(v_row.lists, '[]'::jsonb);

    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);

            -- กรองเอาคนนี้ออก
            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_filtered_entries
            FROM jsonb_array_elements(v_entries) e
            WHERE e->>'memberId' IS DISTINCT FROM p_member_id;

            IF jsonb_array_length(v_filtered_entries) < jsonb_array_length(v_entries) THEN
                v_removed := true;
            END IF;

            v_q := jsonb_set(v_q, '{entries}', v_filtered_entries);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบ List คิวที่ระบุ');
    END IF;

    UPDATE public.guild_queues
    SET lists = v_new_lists,
        updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ยกเลิกการต่อคิวเรียบร้อยแล้ว',
        'removed', v_removed
    );
END;
$$;


-- 3. ฟังก์ชันลบสมาชิกตาม Entry ID (สำหรับแอดมิน) แบบ Atomic
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
    v_filtered_entries JSONB;
    v_found BOOLEAN := false;
    v_removed BOOLEAN := false;
BEGIN
    SELECT * INTO v_row
    FROM public.guild_queues
    WHERE id = p_guild_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลคิวของกิลด์นี้');
    END IF;

    v_lists := COALESCE(v_row.lists, '[]'::jsonb);

    FOR v_q IN SELECT * FROM jsonb_array_elements(v_lists)
    LOOP
        IF v_q->>'id' = p_queue_id THEN
            v_found := true;
            v_entries := COALESCE(v_q->'entries', '[]'::jsonb);

            -- กรองเอา entry นี้ออก
            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_filtered_entries
            FROM jsonb_array_elements(v_entries) e
            WHERE e->>'id' IS DISTINCT FROM p_entry_id;

            IF jsonb_array_length(v_filtered_entries) < jsonb_array_length(v_entries) THEN
                v_removed := true;
            END IF;

            v_q := jsonb_set(v_q, '{entries}', v_filtered_entries);
            v_q := jsonb_set(v_q, '{updatedAt}', to_jsonb(to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        END IF;

        v_new_lists := v_new_lists || jsonb_build_array(v_q);
    END LOOP;

    IF NOT v_found THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบ List คิวที่ระบุ');
    END IF;

    UPDATE public.guild_queues
    SET lists = v_new_lists,
        updated_at = NOW()
    WHERE id = p_guild_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลบสมาชิกออกจากคิวเรียบร้อยแล้ว',
        'removed', v_removed
    );
END;
$$;


-- 4. มอบสิทธิ์ให้ทั้งผู้ใช้ทั่วไปและแอดมินสามารถเรียกใช้ฟังก์ชันนี้ได้
GRANT EXECUTE ON FUNCTION public.join_queue_atomic(INT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leave_queue_atomic(INT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_queue_entry_atomic(INT, TEXT, TEXT) TO anon, authenticated, service_role;

