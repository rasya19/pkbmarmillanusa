import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, ShieldCheck, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function TeacherProfile() {
  const [loading, setLoading] = useState(true);
  const [savingBiodata, setSavingBiodata] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [biodata, setBiodata] = useState({
    nama: '',
    email: '',
    phone: '',
    alamat: '',
    nip: ''
  });

  const [passwordState, setPasswordState] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentRole = localStorage.getItem('userRole') || 'Guru';
      const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';
      const identifier = currentRole === 'Siswa' ? 'nisn' : 'email';
      const val = currentRole === 'Siswa' ? user.email?.split('@')[0] : user.email;

      let query = supabase.from(table).select('*');
      if (val) {
        query = query.or(`id.eq.${user.id},${identifier}.eq.${val}`);
      } else {
        query = query.eq('id', user.id);
      }

      const { data } = await query.maybeSingle();
      if (data) {
        setBiodata({
          nama: data.nama || data.name || '',
          email: data.email || user.email || '',
          phone: data.phone || data.whatsapp || '',
          alamat: data.alamat || '',
          nip: data.nip || data.nisn || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBiodata = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingBiodata(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi tidak valid');

      const currentRole = localStorage.getItem('userRole') || 'Guru';
      const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';
      
      const form = new FormData(e.currentTarget);
      const updateData = {
        nama: form.get('nama')?.toString() || biodata.nama,
        nip: form.get('nip')?.toString() || biodata.nip,
        email: form.get('email')?.toString() || biodata.email,
        whatsapp: form.get('whatsapp')?.toString() || biodata.phone,
        phone: form.get('whatsapp')?.toString() || biodata.phone,
        alamat: form.get('alamat')?.toString() || biodata.alamat
      };

      const { error } = await supabase.from(table).update(updateData).eq('id', user.id);
      if (error) throw error;

      toast.success('Biodata Berhasil Disimpan!');
      if (currentRole === 'Guru') localStorage.setItem('teacherName', updateData.nama);
      setBiodata((prev) => ({ ...prev, ...updateData, phone: updateData.whatsapp }));
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingBiodata(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.newPassword) return toast.error('Password baru wajib diisi');
    if (passwordState.newPassword !== passwordState.confirmPassword) return toast.error('Konfirmasi password tidak cocok');
    if (passwordState.newPassword.length < 6) return toast.error('Password minimal 6 karakter');

    setSavingPassword(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: passwordState.newPassword
      });
      if (authError) throw authError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentRole = localStorage.getItem('userRole') || 'Guru';
        const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';
        await supabase.from(table).update({ must_change_password: false }).eq('id', user.id);
      }

      toast.success('Password Berhasil Diperbarui!');
      setPasswordState({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error('Gagal ganti password: ' + err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Memuat Profil...</p>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-brand-sidebar uppercase italic tracking-tighter flex items-center gap-3">
          <User className="w-8 h-8 text-brand-accent" />
          Profil <span className="text-brand-accent">Saya</span>
        </h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Data pribadi dan pengaturan keamanan pengajar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center text-brand-accent text-3xl font-black italic mb-6">
              {biodata.nama ? biodata.nama.charAt(0).toUpperCase() : 'G'}
            </div>
            <h3 className="text-lg font-black text-brand-sidebar uppercase italic">{biodata.nama || 'Nama Guru'}</h3>
            <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-4">NIP: {biodata.nip || '-'}</p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm">
            <h3 className="text-sm font-black text-brand-sidebar uppercase italic mb-6">Biodata Mandiri</h3>
            <form onSubmit={handleUpdateBiodata} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="nama" type="text" value={biodata.nama} onChange={e => setBiodata({...biodata, nama: e.target.value})} placeholder="Nama Lengkap" className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none" required />
                <input name="nip" type="text" value={biodata.nip} onChange={e => setBiodata({...biodata, nip: e.target.value})} placeholder="NIP" className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="email" type="email" value={biodata.email} onChange={e => setBiodata({...biodata, email: e.target.value})} placeholder="Email" className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none" required />
                <input name="whatsapp" type="text" value={biodata.phone} onChange={e => setBiodata({...biodata, phone: e.target.value})} placeholder="Telepon" className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none" required />
              </div>
              <textarea name="alamat" value={biodata.alamat} onChange={e => setBiodata({...biodata, alamat: e.target.value})} placeholder="Alamat" className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none h-24 resize-none" />
              <button type="submit" disabled={savingBiodata} className="w-full bg-brand-sidebar text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                {savingBiodata ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Biodata
              </button>
            </form>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <h3 className="text-sm font-black text-brand-sidebar uppercase italic mb-6">Ganti Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={passwordState.newPassword} onChange={e => setPasswordState({...passwordState, newPassword: e.target.value})} placeholder="Password Baru" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <input type="password" value={passwordState.confirmPassword} onChange={e => setPasswordState({...passwordState, confirmPassword: e.target.value})} placeholder="Konfirmasi Password" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" />
              <button type="submit" disabled={savingPassword} className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Perbarui Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
