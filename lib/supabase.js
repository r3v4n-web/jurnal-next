import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// false kalau .env.local belum diisi.
export const supabaseReady = Boolean(url && key);

export const supabase = supabaseReady ? createClient(url, key) : null;
