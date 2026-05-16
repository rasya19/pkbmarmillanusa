import { GetServerSideProps } from 'next'
import { createClient } from '@supabase/supabase-js'

type Siswa = {
  id: string
  nama: string
  nisn: string
  kelas: string
}

type Props = {
  initialSiswa: Siswa[]
  schoolName: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const host = req.headers.host || ''
  const subdomain = host.split('.')[0]
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Ini yg penting
  )

  const { data: school } = await supabase
  .from('schools')
  .select('nama_sekolah, npsn')
  .eq('slug', subdomain)
  .single()

  if (!school) {
    return { props: { initialSiswa: [], schoolName: 'Sekolah Tidak Ditemukan' } }
  }

  const { data: siswa } = await supabase
  .from('profiles_siswa')
  .select('*')
  .eq('school_npsn', school.npsn)

  return {
    props: {
      initialSiswa: siswa || [],
      schoolName: school.nama_sekolah
    }
  }
}

export default function Siswa({ initialSiswa, schoolName }: Props) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{schoolName}</h1>
      <p className="mb-4">Total: {initialSiswa.length}</p>
      
      <table className="w-full border">
        <thead>
          <tr>
            <th>Nama</th>
            <th>NISN</th>
            <th>Kelas</th>
          </tr>
        </thead>
        <tbody>
          {initialSiswa.map((s) => (
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
