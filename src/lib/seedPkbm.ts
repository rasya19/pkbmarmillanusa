
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedPkbm() {
  try {
    console.log('Inserting into schools...');
    await supabase.from('schools').insert([{
        name: 'PKBM Nurul Falah',
        slug: 'fallah',
        is_active: true,
        whatsapp: '+6285225025555'
    }]);

    console.log('Inserting into registrations...');
    await supabase.from('registrations').insert([{
        school_name: 'PKBM Nurul Falah',
        subdomain: 'fallah',
        whatsapp: '085225025555',
        status: 'pending'
    }]);

    console.log('School inserted. Signing up user...');
    
    // As per user request, sign up the user
    // Note: This relies on Supabase Auth, client-side supabase client can do this.
    const { data, error: authError } = await supabase.auth.signUp({
      email: 'ismantoj88@gmail.com',
      password: 'DEMOACCOUNT123!',
      options: {
        data: {
          npsn: 'P1234566',
          role: 'admin'
        }
      }
    });

    if (authError) throw authError;

    console.log('Successfully seeded PKBM Nurul Falah and created user.');
  } catch (error: any) {
    console.error('Seed error:', error);
  }
}

seedPkbm();
