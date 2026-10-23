import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lzlrlnmphtjotgeumqht.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_YjR6DcMPq2OD3l0JVVMzPg_tigMFS6H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

