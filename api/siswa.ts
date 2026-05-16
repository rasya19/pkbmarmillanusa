import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )
    
    const { data, error } = await supabase
      .from('profiles_siswa')
      .select('*')
      .eq('school_npsn', 'P9984421')  // ← cuma ambil NPSN ini

    if (error) throw error
    
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
