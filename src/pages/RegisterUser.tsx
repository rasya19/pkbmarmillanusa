import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

export default function RegisterUser() {
  const { school } = useSchool();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Siswa'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setLoading(true);
    try {
      await supabase.from('user_registrations').insert([{
        ...formData,
        school_id: school.slug,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      toast.success('Pendaftaran berhasil! Menunggu persetujuan Admin Sekolah.');
      navigate('/');
    } catch (error) {
      toast.error('Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg p-10 rounded-[2.5rem] shadow-xl border border-brand-border">
        <h2 className="text-2xl font-black text-brand-sidebar uppercase italic tracking-tighter mb-8">Registrasi {school?.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" placeholder="Nama Lengkap" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="email" placeholder="Email" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
          <select className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, role: e.target.value})}>
            <option>Siswa</option>
            <option>Guru</option>
          </select>
          <button disabled={loading} className="w-full bg-brand-accent text-brand-sidebar py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus />} Daftar Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}
