import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )
    
    const { data, error } = await supabase
      .from('profiles_siswa')  // ← GANTI INI
      .select('*')             // ← ambil semua kolom dulu
      .ilike('nama', '%armilla%')  // ← filter yg nama mengandung armilla

    if (error) throw error
    
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
