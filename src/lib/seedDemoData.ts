import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export async function seedDemoData() {
  try {
    const demoSchools = [
      {
        id: 'demo-silver',
        name: 'Demo Silver School',
        slug: 'demo-silver',
        npsn: '12345678',
        subscription_plan: 'Silver',
        status: 'active',
        admin_email: 'demo.silver@example.com', 
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-gold',
        name: 'Demo Gold School',
        slug: 'demo-gold',
        npsn: '87654321',
        subscription_plan: 'Gold',
        status: 'active',
        admin_email: 'demo.gold@example.com',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-platinum',
        name: 'Demo Platinum School',
        slug: 'demo-platinum',
        npsn: '11223344',
        subscription_plan: 'Platinum',
        status: 'active',
        admin_email: 'demo.platinum@example.com',
        created_at: new Date().toISOString()
      }
    ];

    const { error } = await supabase
      .from('schools')
      .upsert(demoSchools, { onConflict: 'id' });

    if (error) throw error;
    
    toast.success('Data demo berhasil di-seeding!');
  } catch (error: any) {
    console.error('Seed error:', error);
    toast.error('Gagal seeding data: ' + (error.message || 'Error tidak dikenal'));
  }
}
