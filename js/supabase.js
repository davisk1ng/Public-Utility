import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cavkxartefgtpufurdii.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Gczm5UIy7RBQOqxK0ytrsA_EQ7yrozL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
