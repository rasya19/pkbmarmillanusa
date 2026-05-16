import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSchool } from '../contexts/SchoolContext' // <-- pake context

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // Pake ANON_KEY aja, RLS udah mati
)

type Siswa = {
  id: string
  nama: string
  nisn: string
  kelas: string
}

export default function DataSiswa() {
  const { school, loading: schoolLoading } = useSchool() // ambil dari context
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSiswa = async () => {
      if (!school?.npsn) return // tunggu school keload
      
      setLoading(true)
      const { data, error } = await supabase
      .from('profiles_siswa')
      .select('*')
      .eq('school_npsn', school.npsn)

      if (error) {
        console.error('Error fetch siswa:', error)
      } else {
        setSiswa(data || [])
      }
      setLoading(false)
    }

    fetchSiswa()
  }, [school?.npsn]) // jalan tiap school ganti

  if (schoolLoading || loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{school?.nama_sekolah}</h1>
      <p className="mb-4">Total: {siswa.length}</p>
      
      <table className="w-full border">
        <thead>
          <tr>
            <th>Nama</th>
            <th>NISN</th>
            <th>Kelas</th>
          </tr>
        </thead>
        <tbody>
          {siswa.map((s) => (
            <tr key={s.id}>
              <td>{s.nama}</td>
              <td>{s.nisn}</td>
              <td>{s.kelas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
