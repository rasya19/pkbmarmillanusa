import { useEffect, useState } from 'react'

export default function DataSiswa() {
  const [siswa, setSiswa] = useState([])

  useEffect(() => {
    // Panggil API Vercel yg udah kita bikin
    fetch('/api/siswa')
      .then(res => res.json())
      .then(data => setSiswa(data))
  }, [])

  return (
    <div>
      <h1>Data Siswa</h1>
      <h2>Total: {siswa.length}</h2>  // ← ini bakal berubah dari 0
      <ul>
        {siswa.map(s => (
          <li key={s.id}>{s.nama} - {s.class}</li>
        ))}
      </ul>
    </div>
  )
}
