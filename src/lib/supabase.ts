import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key || url.includes('your-project-id')) {
  console.warn('[vigia] Supabase env vars not set — check .env');
}

export const supabase = createClient(url, key);
