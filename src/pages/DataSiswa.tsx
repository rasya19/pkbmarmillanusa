import { useEffect, useState } from 'react'

type Siswa = {
  id: string
  nama: string | null
  nisn: string | null
  class: string | null
  whatsapp: string | null
  is_approved: boolean
  school_npsn: string
}

export default function DataSiswa() {
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Fetch /api/siswa dimulai...')
    
    fetch('/api/siswa')
      .then(res => {
        console.log('Response status:', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        console.log('Data dari API:', data)
        setSiswa(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Gagal fetch:', err)
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
        <p>Tidak ada data siswa.</
