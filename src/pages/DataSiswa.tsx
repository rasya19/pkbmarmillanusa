import { useEffect, useState } from 'react'
import { Search, GraduationCap, UserPlus } from 'lucide-react'

type Siswa = {
  id: string
  nama: string | null
  nisn: string | null
  class: string | null
  whatsapp: string | null
  is_approved: boolean
}

export default function DataSiswa() {
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/siswa')
      .then(res => res.json())
      .then(data => {
        setSiswa(data || [])
        setFilteredSiswa(data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const filtered = siswa.filter(s => 
      s.nama?.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn?.includes(search)
    )
    setFilteredSiswa(filtered)
  }, [search, siswa])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header Card Hitam */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-green-500/20 p-3 rounded-xl">
            <GraduationCap className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MASTER DATA <span className="text-green-400">SISWA</span></h1>
            <p className="text-gray-300 text-sm">KELOLA DATA SISWA PKBM ARMILLANUSA</p>
          </div>
        </div>
        <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold">
          <UserPlus size={18} />
          TAMBAH SISWA
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama atau NISN..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
             
