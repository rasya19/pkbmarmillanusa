import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  ShieldCheck, 
  Save, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProfileGuru() {
  const [loading, setLoading] = useState(true);
  const [savingBiodata, setSavingBiodata] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const [isMustChange, setIsMustChange] = useState(false);

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
      
      if (!user) {
        toast.error('Gagal mengambil sesi pengguna.');
        return;
      }

      setTeacherId(user.id);
      const currentRole = localStorage.getItem('userRole') || 'Guru';
      const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setIsMustChange(!!data.must_change_password);
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

  const handleUpdateBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;

    setSavingBiodata(true);
    try {
      const currentRole = localStorage.getItem('userRole') || 'Guru';
      const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';

      const updateData: any = {
        nama: biodata.nama,
        email: biodata.email,
        phone: biodata.phone,
        whatsapp: biodata.phone,
        alamat: biodata.alamat
      };

      if (currentRole === 'Siswa') {
        delete updateData.phone; // Students usually use whatsapp column
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', teacherId);

      if (error) throw error;
      toast.success('Biodata berhasil diperbarui');
    } catch (err: any) {
      toast.error('Gagal memperbarui biodata: ' + err.message);
    } finally {
      setSavingBiodata(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... validation logic ...
    if (!passwordState.newPassword) {
      toast.error('Password baru wajib diisi');
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok. Pastikan kedua input sama.');
      return;
    }

    if (passwordState.newPassword.length < 6) {
      toast.error('Keamanan Lemah: Password minimal harus 6 karakter.');
      return;
    }

    setSavingPassword(true);
    try {
      // 2. Verified Session Check
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error('Sesi Habis: Silakan login ulang.');
        return;
      }

      // 3. Supabase Auth Update
      const { error: authError } = await supabase.auth.updateUser({
        password: passwordState.newPassword
      });

      if (authError) throw authError;

      // 4. Update must_change_password flag
      const currentRole = localStorage.getItem('userRole') || 'Guru';
      const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';

      await supabase
        .from(table)
        .update({ must_change_password: false })
        .eq('id', teacherId);

      toast.success('Password Berhasil Diperbarui!');
      setPasswordState({ newPassword: '', confirmPassword: '' });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.reload(); // Refresh to clear guards
      }, 2000);
      
    } catch (err: any) {
      toast.error('Gagal Ganti Password: ' + err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const isPasswordValid = passwordState.newPassword.length >= 6 && passwordState.newPassword === passwordState.confirmPassword;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Memuat Profil Saya...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {isMustChange && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative border-4 border-brand-accent/30 text-center"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
              <ShieldCheck className="w-10 h-10" />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight mb-2">
              Wajib Ganti Password
            </h2>
            <p className="text-xs font-bold text-slate-500 mb-8">
              Silakan ganti password default Anda untuk alasan keamanan sebelum melanjutkan.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password Baru</label>
                <input 
                  type="password" 
                  placeholder="Masukkan Password Baru" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full p-4 border-2 border-slate-200 rounded-2xl text-black font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Konfirmasi Password</label>
                <input 
                  type="password" 
                  placeholder="Konfirmasi Password Baru" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full p-4 border-2 border-slate-200 rounded-2xl text-black font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-tight">⚠ Password konfirmasi tidak cocok!</p>
              )}

              <button 
                type="button"
                onClick={async () => {
                  if (newPassword.length < 6) {
                    toast.error('Minimal 6 karakter!');
                    return;
                  }
                  setSavingPassword(true);
                  try {
                    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
                    if (authError) throw authError;

                    const currentRole = localStorage.getItem('userRole') || 'Guru';
                    const table = currentRole === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';
                    await supabase.from(table).update({ must_change_password: false }).eq('id', teacherId);

                    toast.success('Password berhasil diperbarui!');
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (err: any) {
                    toast.error(err.message);
                  } finally {
                    setSavingPassword(false);
                  }
                }}
                disabled={savingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className={cn(
                  "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                  newPassword && newPassword === confirmPassword && newPassword.length >= 6
                    ? "bg-brand-sidebar text-white hover:bg-emerald-600 active:scale-95" 
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ubah Password Sekarang
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-brand-sidebar uppercase italic tracking-tighter flex items-center gap-3">
          <User className="w-8 h-8 text-brand-accent" />
          Pengaturan <span className="text-brand-accent">Akun Saya</span>
        </h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Kelola informasi pribadi dan keamanan akun guru</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Profile Card View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-slate-100 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center text-brand-accent text-3xl font-black italic">
                {biodata.nama ? biodata.nama.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            
            <h3 className="text-lg font-black text-brand-sidebar uppercase italic">{biodata.nama || 'Nama Guru'}</h3>
            <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-4">NIP: {biodata.nip || '-'}</p>
            
            <div className="w-full space-y-3 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 text-slate-500 px-4 py-2 bg-slate-50 rounded-xl">
                <Mail className="w-3.5 h-3.5 text-brand-accent" />
                <span className="text-[10px] font-bold truncate">{biodata.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 px-4 py-2 bg-slate-50 rounded-xl">
                <Phone className="w-3.5 h-3.5 text-brand-accent" />
                <span className="text-[10px] font-bold">{biodata.phone || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-sidebar p-6 rounded-[2rem] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
              <h4 className="text-xs font-black uppercase italic tracking-widest opacity-60">Status Keamanan</h4>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Sesi Terautentikasi</p>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed">Keamanan akun Anda dijamin oleh protokol enkripsi standar industri.</p>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-3 space-y-8">
          {/* Edit Biodata Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-brand-bg rounded-xl border border-brand-border text-brand-sidebar">
                <User className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic">Biodata Mandiri</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Perbarui informasi profil Anda</p>
              </div>
            </div>

            <form onSubmit={handleUpdateBiodata} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={biodata.nama}
                    onChange={(e) => setBiodata({...biodata, nama: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">ID / NIP (Terkunci)</label>
                  <input 
                    type="text" 
                    value={biodata.nip}
                    disabled
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold opacity-60 cursor-not-allowed outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Aktif</label>
                  <input 
                    type="email" 
                    value={biodata.email}
                    onChange={(e) => setBiodata({...biodata, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                  <input 
                    type="text" 
                    value={biodata.phone}
                    onChange={(e) => setBiodata({...biodata, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    placeholder="08xxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Alamat Tinggal</label>
                <textarea 
                  value={biodata.alamat}
                  onChange={(e) => setBiodata({...biodata, alamat: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all h-24 resize-none"
                  placeholder="Jl. Pendidikan No. 123..."
                />
              </div>

              <button 
                type="submit"
                disabled={savingBiodata}
                className="w-full bg-brand-sidebar text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-sidebar/10"
              >
                {savingBiodata ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan Biodata
              </button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-brand-sidebar shadow-sm">
                <Lock className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic">Keamanan Akun</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Perbarui password akses portal Anda</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password Baru</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordState.newPassword}
                      onChange={(e) => setPasswordState({...passwordState, newPassword: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                      placeholder="Minimal 8 karakter"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-accent"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                  <input 
                    type="password" 
                    value={passwordState.confirmPassword}
                    onChange={(e) => setPasswordState({...passwordState, confirmPassword: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    placeholder="Masukkan ulang password"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={savingPassword}
                className="w-full bg-slate-900 border border-slate-800 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 hover:border-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                Ganti Password Sekarang
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
