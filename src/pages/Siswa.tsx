export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const subdomain = query.school as string || ''

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: school } = await supabase
   .from('schools')
   .select('nama_sekolah, npsn') // pake npsn
   .eq('slug', subdomain)
   .single()

  if (!school) {
    return { props: { initialSiswa: [], schoolName: 'Sekolah Tidak Ditemukan' } }
  }

  const { data: siswa } = await supabase
   .from('profiles_siswa')
   .select('*')
   .eq('school_npsn', school.npsn) // filter pake npsn

  return {
    props: {
      initialSiswa: siswa || [],
      schoolName: school.nama_sekolah
    }
  }
}
