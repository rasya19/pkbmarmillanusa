import { useEffect, useState } from 'react'

type Siswa = { id: string, nama: string, nisn: string, kelas: string }

export default function DataSiswa() {
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [schoolName, setSchoolName] = useState('Loading...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/siswa')
    .then(res => res.json())
    .then(data => {
        setSchoolName(data.schoolName)
        setSiswa(data.siswa)
        setLoading(false)
      })
    .catch(err => {
        console.error('Error:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">Loading data siswa...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{schoolName}</h1>
      <p className="mb-4">Total: {siswa.length}</p>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nama</th>
            <th className="border p-2">NISN</th>
            <th className="border p-2">Kelas</th>
          </tr>
        </thead>
        <tbody>
          {siswa.map((s) => (
            <tr key={s.id}>
              <td className="border p-2">{s.nama}</td>
              <td className="border p-2">{s.nisn}</td>
              <td className="border p-2">{s.kelas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
