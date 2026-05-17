
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (error) {
       console.error('Error fetching tables:', error);
       return;
    }
    console.log('Tables in public schema:', data);
  } catch (error) {
    console.error('Fatal:', error);
  }
}

listTables();
