export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const host = req.headers.host || ''
  const subdomain = host.split('.')[0]
  
  console.log('[SISWA] HOST:', host)
  console.log('[SISWA] SUBDOMAIN:', subdomain)
  console.log('[SISWA] ENV URL:', process.env.NEXT_PUBLIC_SUPABASE_URL? 'ADA' : 'KOSONG')
  console.log('[SISWA] ENV KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY? 'ADA' : 'KOSONG')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: school, error: errSchool } = await supabase
 .from('schools')
 .select('nama_sekolah, npsn')
 .eq('slug', subdomain)
 .single()

  console.log('[SISWA] SCHOOL:', school)
  console.log('[SISWA] SCHOOL ERR:', errSchool)

  if (!school) {
    return { props: { initialSiswa: [], schoolName: `Sekolah Tidak Ditemukan: ${subdomain}` } }
  }

  const { data: siswa, error: errSiswa } = await supabase
 .from('profiles_siswa')
 .select('*')
 .eq('school_npsn', school.npsn)

  console.log('[SISWA] NPSN:', school.npsn)
  console.log('[SISWA] JUMLAH SISWA:', siswa?.length)
  console.log('[SISWA] SISWA ERR:', errSiswa)

  return {
    props: {
      initialSiswa: siswa || [],
      schoolName: school.nama_sekolah
    }
  }
}
