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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-green-500/20 p-3 rounded-xl">
            <GraduationCap className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MASTER DATA <span className="text-green-400">SISWA</span></h1>
            <p className="text-gray-300 text-sm">KELOLA DATA SISWA PKBM ARMILLANUSA</p>
          </div>
        <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold transition-all">
          <UserPlus size={18} />
          TAMBAH SISWA
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama atau NISN..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">NAMA SISWA</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">NISN</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">KELAS</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">WHATSAPP</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    {siswa.length === 0 ? 'Tidak ada data siswa' : 'Siswa tidak ditemukan'}
                  </td>
                </tr>
              ) : (
                filteredSiswa.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{s.nama || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-sm">{s.nisn || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-sm font-medium">{s.class || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{s.whatsapp || '-'}</td>
                    <td className="px-6 py-4">
                      {s.is_approved ? (
                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">APPROVED</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">PENDING</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
