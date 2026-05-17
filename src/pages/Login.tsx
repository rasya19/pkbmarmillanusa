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
      // Always sign out of supabase first to clear any stale auth sessions
      // which might cause 401 Unauthorized on public tables
      await supabase.auth.signOut().catch(() => {});

      if (loginRole === 'Guru') {
        // Real static guru
        if (formData.email === 'guru@pkbmarmillanusa.com' && formData.password === 'Guru123!') {
           localStorage.setItem('userRole', 'Guru');
           localStorage.setItem('teacherName', 'Guru PKBM');
           localStorage.setItem('teacherEmail', 'guru@pkbmarmillanusa.com');
           // Removes demo flag so it behaves as real
           localStorage.removeItem('isDemoMode');
           setIsLoading(false);
           navigate('/dashboard');
           return;
        }

        // Mock teacher login for demo
        if (formData.email === 'demo_guru' && formData.password === 'teacher123') {
           localStorage.setItem('userRole', 'Guru');
           localStorage.setItem('isDemoMode', 'true');
           localStorage.setItem('teacherName', 'Dra. Siti Aminah');
           localStorage.setItem('teacherEmail', 'siti@email.com'); // Match with template email in Guru.tsx
           setIsLoading(false);
           navigate('/dashboard');
           return;
        }

        const { data: guruData, error: dbError } = await supabase
          .from('profiles_guru')
          .select('*')
          .eq('email', formData.email)
          .eq('password', formData.password)
          .single();

        if (dbError || !guruData) {
          // If not found in profiles_guru, try real Auth as fallback
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (authError) throw new Error('Email atau password salah.');

          if (data.user) {
            localStorage.setItem('userRole', 'Guru');
            localStorage.setItem('teacherName', data.user.email?.split('@')[0] || 'Guru');
            localStorage.setItem('teacherEmail', data.user.email || '');
            navigate('/dashboard');
          }
        } else {
          localStorage.setItem('userRole', 'Guru');
          localStorage.setItem('teacherName', guruData.nama || guruData.name || 'Guru');
          localStorage.setItem('teacherEmail', guruData.email || '');
          navigate('/dashboard');
        }
        return;
      }

      if (loginRole === 'Siswa') {
        // Mock student login for demo
        if (formData.nisn === '0012345678') {
          localStorage.setItem('userRole', 'Siswa');
          localStorage.setItem('isDemoMode', 'true');
          localStorage.setItem('studentName', 'Budi Santoso');
          localStorage.setItem('studentNisn', '0012345678');
          localStorage.setItem('studentId', 'demo-siswa-1');
          setIsLoading(false);
          navigate('/dashboard');
          return;
        }

        // Real student login by NISN
        const { data, error } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('nisn', formData.nisn)
          .single();

        if (error || !data) {
          throw new Error('NISN tidak ditemukan atau akun tidak aktif.');
        }

        if (data.is_online) {
          throw new Error('Akun sedang aktif di perangkat lain. Hubungi admin untuk mereset sesi (Database Sync).');
        }

        // Mark as online
        await supabase.from('profiles_siswa').update({ is_online: true }).eq('id', data.id);

        localStorage.setItem('userRole', 'Siswa');
        localStorage.setItem('studentName', data.nama);
        localStorage.setItem('studentNisn', data.nisn);
        localStorage.setItem('studentId', data.id);
        localStorage.setItem('studentClass', data.class);
        navigate('/dashboard');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('DEBUG [Login] Auth Error:', error);
        throw error;
      }

      // Successful login
      if (data.user) {
        localStorage.setItem('userEmail', data.user.email || '');
        
        // Fetch profile with more flexibility
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.warn('DEBUG [Login] Profile Query Error:', profileError);
        }

        // Try extracting role from various sources
        // 1. From profiles table (trying multiple column names)
        // 2. From user metadata (as fallback)
        // 3. Special case for the known SuperAdmin email
        const dbRole = profile?.role || profile?.peran || profile?.status;
        const metaRole = data.user.user_metadata?.role || data.user.user_metadata?.peran;
        
        let finalRole = dbRole || metaRole || 'Siswa';
        
        // Force SuperAdmin role for the principal email if configured as such or if on master domain
        if (data.user.email?.toLowerCase() === 'ismanto095@gmail.com') {
          finalRole = 'SuperAdmin';
        }
        
        console.log('DEBUG [Login] Resolved Role:', finalRole);
        localStorage.setItem('userRole', finalRole);
        
        // Also store name if available
        const userName = profile?.nama || profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Admin';
        localStorage.setItem('adminName', userName);

        localStorage.removeItem('isDemoMode');
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Login gagal. Periksa kembali email dan password Anda.');
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
