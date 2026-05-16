import { GetServerSideProps } from 'next'
import { createClient } from '@supabase/supabase-js'
import React, { useState } from 'react'
// ... import lain kamu: Search, UserPlus, dll biarin aja

type Props = {
  initialSiswa: any[]
  schoolName: string
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const subdomain = query.school as string || ''

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Wajib ada di Vercel Env
  )

  const { data: school } = await supabase
   .from('schools')
   .select('id, name')
   .eq('subdomain', subdomain)
   .single()

  if (!school) {
    return { props: { initialSiswa: [], schoolName: 'Sekolah Tidak Ditemukan' } }
  }

  const { data: siswa } = await supabase
   .from('siswa')
   .select('*')
   .eq('school_id', school.id)

  return {
    props: {
      initialSiswa: siswa || [],
      schoolName: school.name
    }
  }
}

const Siswa: React.FC<Props> = ({ initialSiswa, schoolName }) => {
  const [siswa, setSiswa] = useState(initialSiswa)
  // ... sisa state & function kamu biarin aja

  return (
    <div>
      <h1>Data Siswa - {schoolName}</h1>
      <p>Total: {siswa.length}</p>
      {/* ... tabel kamu di sini, pake data 'siswa' */}
    </div>
  )
}

export default Siswa
