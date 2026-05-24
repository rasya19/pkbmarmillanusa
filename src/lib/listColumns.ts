
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listColumns() {
  try {
    console.log('--- SCHOOLS TABLE ---');
    const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('*').limit(1);
    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError);
    } else if (schoolsData && schoolsData.length > 0) {
      console.log('Columns:', Object.keys(schoolsData[0]));
    } else {
       console.log('Schools table is empty or could not be queried meaningfully for columns.');
    }

    console.log('\n--- REGISTRATIONS TABLE ---');
    const { data: regData, error: regError } = await supabase.from('registrations').select('*').limit(1);
     if (regError) {
      console.error('Error fetching registrations:', regError);
    } else if (regData && regData.length > 0) {
      console.log('Columns:', Object.keys(regData[0]));
    } else {
       console.log('Registrations table is empty or could not be queried meaningfully for columns.');
    }
    
    // Try to get one row even if it fails to see error details which might contain hints
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

listColumns();
