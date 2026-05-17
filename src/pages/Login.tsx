import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useSchool } from '../contexts/SchoolContext';
import { 
  ShieldCheck, 
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const navigate = useNavigate();
  const { school, error, isMasterDomain } = useSchool();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Set initial login role based on domain
  const [loginRole, setLoginRole] = useState<'Admin' | 'Guru' | 'Siswa' | 'Tamu'>('Admin');

  useEffect(() => {
    if (isMasterDomain) {
      setLoginRole('Admin');
    }
  }, [isMasterDomain]);

  // Handle school-level errors (tenant inactive/not found)
  useEffect(() => {
    if (error) {
      setErrorMsg(error);
    }
  }, [error]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nisn: ''
  });

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Clear previous session data
    const keysToInitialClear = ['userRole', 'adminName', 'teacherName', 'studentName', 'studentId', 'studentNisn', 'studentClass', 'isDemoMode'];
    keysToInitialClear.forEach(k => localStorage.removeItem(k));

    try {
      const emailTrimmed = formData.email.trim().toLowerCase();
      const passwordRaw = formData.password;

      console.log('DEBUG [Auth] Attempting login for:', emailTrimmed);
      console.log('DEBUG [Auth] Password length:', passwordRaw.length);

      if (loginRole === 'Guru') {
        const { data: guruData, error: dbError } = await supabase
          .from('profiles_guru')
          .select('*')
          .eq('email', emailTrimmed)
          .eq('password', passwordRaw)
          .single();

        if (dbError || !guruData) {
          console.log('DEBUG [Auth] Guru not found in profiles_guru, falling back to Auth');
        } else {
          localStorage.setItem('userRole', 'Guru');
          localStorage.setItem('teacherName', guruData.nama || guruData.name || 'Guru');
          localStorage.setItem('teacherEmail', guruData.email || '');
          navigate('/dashboard');
          return;
        }
      }

      if (loginRole === 'Siswa') {
        const { data: sData, error: sError } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('nisn', formData.nisn)
          .single();

        if (sError || !sData) throw new Error('NISN tidak ditemukan.');
        if (sData.is_online) throw new Error('Akun sedang aktif di perangkat lain.');

        await supabase.from('profiles_siswa').update({ is_online: true }).eq('id', sData.id);
        localStorage.setItem('userRole', 'Siswa');
        localStorage.setItem('studentName', sData.nama);
        localStorage.setItem('studentId', sData.id);
        localStorage.setItem('studentClass', sData.class);
        navigate('/dashboard');
        return;
      }

      // Default Auth Login (Admin/SuperAdmin)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: passwordRaw,
      });

      if (authError) {
        console.error('DEBUG [Auth] Supabase Rejection:', authError.message);
        throw authError;
      }

      if (data.user) {
        console.log('DEBUG [Auth] Success! User ID:', data.user.id);
        localStorage.setItem('userEmail', data.user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        let finalRole = profile?.role || profile?.peran || data.user.user_metadata?.role || 'Siswa';
        
        // Final sanity check for principal email
        if (data.user.email?.toLowerCase() === 'ismanto095@gmail.com') {
          finalRole = 'SuperAdmin';
        }
        
        localStorage.setItem('userRole', finalRole);
        localStorage.setItem('adminName', profile?.nama || profile?.name || 'Master Admin');
        localStorage.removeItem('isDemoMode');
        
        if (finalRole === 'SuperAdmin' && isMasterDomain) {
          navigate('/master-admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('DEBUG [Auth] Final Catch:', error.message);
      setErrorMsg(error.message === 'Invalid login credentials' 
        ? 'Email atau Password salah. (Supabase Auth Reject)' 
        : error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center justify-center p-6 text-slate-200">
      <div className="w-full max-w-md space-y-12">
        
        {/* Top Header */}
        <div className="flex justify-between items-end mb-8">
           <button 
             onClick={() => navigate('/')}
             className="flex items-center gap-2 p-3 text-slate-400 hover:text-emerald-400 transition-all font-bold text-xs uppercase tracking-widest"
           >
              <ArrowLeft className="w-4 h-4" /> Kembali
           </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-slate-800 rounded-[2.5rem] border border-slate-700 p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
          
          <div className="relative z-10">
            {!isMasterDomain && (
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700 mb-8 overflow-x-auto">
                <button 
                  type="button"
                  onClick={() => setLoginRole('Admin')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    loginRole === 'Admin' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Admin
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginRole('Guru')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    loginRole === 'Guru' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Guru
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginRole('Siswa')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    loginRole === 'Siswa' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Siswa
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginRole('Tamu')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    loginRole === 'Tamu' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Tamu
                </button>
              </div>
            )}

            {loginRole === 'Tamu' ? (
              <div className="text-center py-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 text-emerald-400 w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-black text-white uppercase italic tracking-widest text-lg mb-2">MASUK SEBAGAI <span className="text-emerald-400">TAMU</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 leading-relaxed px-4">
                  Anda akan masuk dengan akses terbatas ke fitur diskusi dan profil publik.
                </p>
                <button 
                  onClick={() => {
                    localStorage.setItem('userRole', 'Tamu');
                    localStorage.setItem('adminName', 'Pengunjung Tamu');
                    navigate('/dashboard/diskusi');
                  }}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Masuk Sekarang <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase italic tracking-widest text-lg">LOG<span className="text-emerald-400">IN</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  {isMasterDomain ? 'Portal Pusat Rasyatech' : (school?.name ? `Portal Terpadu ${school.name}` : 'Portal Terpadu Armilla')}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {loginRole !== 'Siswa' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">
                      Email Akun {loginRole}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="nama@email.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Kata Sandi</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-12 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">
                    Nomor NISN Siswa
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={formData.nisn}
                      onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                      placeholder="Masukkan 10 digit NISN Anda"
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button 
                  type="button" 
                  className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 uppercase tracking-widest transition-colors italic"
                >
                  Lupa Password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk Sekarang <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </motion.div>

        {/* Footer Help */}
        <div className="pt-8 border-t border-slate-800 text-center">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic mb-2">
              Bermasalah dengan akun? <button className="text-emerald-400 hover:underline decoration-2 underline-offset-4">Hubungi Admin</button>
           </p>
        </div>
      </div>
    </div>
  );
}
