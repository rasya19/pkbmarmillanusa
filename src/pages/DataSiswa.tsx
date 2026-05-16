import { useEffect, useState } from 'react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/siswa')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setSiswa(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading data siswa...</div>
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>

  return (
    <div style={{padding: '20px'}}>
      <h1>Data Siswa PKBM ARMILLANUSA</h1>
      <h2>Total: {siswa.length}</h2>
      
      {siswa.length === 0 ? (
        <p>Tidak ada data siswa.</p>
      ) : (
        <table border={1} cellPadding={8} style={{borderCollapse: 'collapse', width: '100%'}}>
          <thead>
            <tr style={{background: '#f0f0f0'}}>
              <th>Nama</th>
              <th>NISN</th>
              <th>Kelas</th>
              <th>WhatsApp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {siswa.map(s => (
              <tr key={s.id}>
                <td>{s.nama || '-'}</td>
                <td>{s.nisn || '-'}</td>
                <td>{s.class || '-'}</td>
                <td>{s.whatsapp || '-'}</td>
                <td>{s.is_approved ? 'Approved' : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
