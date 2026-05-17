import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const cleanSupabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const dummyClient = {
  from: () => ({
    select: () => ({ eq: () => ({ order: () => ({ data: [], error: { message: 'Supabase Not Configured' } }), single: () => ({ data: null, error: { message: 'Supabase Not Configured' } }) }) }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase Not Configured' } }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase Not Configured' } }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase Not Configured' } }) }),
  }),
  auth: {
    signUp: async () => ({ data: null, error: { message: 'Supabase Not Configured' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase Not Configured' } }),
    signOut: async () => ({ error: { message: 'Supabase Not Configured' } })
  }
} as any;

let client;
try {
  console.log('DEBUG [Supabase] Initializing with URL:', cleanSupabaseUrl ? 'PRESENT' : 'MISSING');
  if (cleanSupabaseUrl && supabaseAnonKey && cleanSupabaseUrl.startsWith('http')) {
     client = createClient(cleanSupabaseUrl, supabaseAnonKey);
     console.log('DEBUG [Supabase] Client created successfully');
  } else {
     console.warn('DEBUG [Supabase] Using dummy client - check environment variables (VITE_SUPABASE_URL)');
     client = dummyClient;
  }
} catch (e) {
  console.error('DEBUG [Supabase] Initialization fatal error:', e);
  client = dummyClient;
}

export const supabase = client;
