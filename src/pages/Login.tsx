import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  EyeOff,
  Users,
  UserPlus
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { school, error, isMasterDomain } = useSchool();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Set initial login role based on state or domain
  const [loginRole, setLoginRole] = useState<'Admin' | 'Guru' | 'Siswa' | 'Tamu'>('Admin');

  useEffect(() => {
    // Priority: State from Navigation -> isMasterDomain check
    if (location.state?.role) {
      setLoginRole(location.state.role);
    } else if (isMasterDomain) {
      setLoginRole('Admin');
    }
  }, [isMasterDomain, location.state]);

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 1. AMBIL VALUE DATA FORM (Mandat Mutlak Pak Ismanto)
    const dataForm = new FormData(e.currentTarget);
    const emailUtama = dataForm.get('email')?.toString().trim();
    const passwordUtama = dataForm.get('password')?.toString();
    const nisnInput = dataForm.get('nisn')?.toString();

    // Jalur Siswa (NISN)
    if (loginRole === 'Siswa') {
      if (!nisnInput) {
        alert("NISN tidak boleh kosong!");
        setIsLoading(false);
        return;
      }

      try {
        const { data: sData, error: sError } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('nisn', nisnInput.trim())
          .maybeSingle();

        if (sError || !sData) {
          alert('NISN tidak ditemukan di pangkalan data siswa.');
          setIsLoading(false);
          return;
        }

        // Auto-unlock active online sessions to prevent lockouts during testing
        if (sData.is_online) {
          console.log('Unlocking active session automatically for NISN:', sData.nisn);
        }

        // Generate virtual siswa email and password dynamically for real Supabase Auth
        const virtualEmail = `${sData.nisn.trim()}@siswa.rasyatech.com`;
        const virtualPassword = sData.password || '123456';

        let authUser = null;
        
        // Attempt login using actual Supabase Auth credentials
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: virtualPassword
        });

        if (signInError) {
          // If auth user account does not exist in Auth schema yet, provision/signUp them dynamically
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: virtualEmail,
            password: virtualPassword,
            options: {
              data: {
                role: 'Siswa',
                nisn: sData.nisn
              }
            }
          });

          if (signUpError) {
            throw new Error(`Gagal mendaftarkan akun sistem Siswa: ${signUpError.message}`);
          }

          const { data: reSignInData, error: reSignInError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: virtualPassword
          });

          if (reSignInError) {
            throw new Error(`Gagal login setelah registrasi Siswa: ${reSignInError.message}`);
          }
          authUser = reSignInData.user;
        } else {
          authUser = authData.user;
        }

        // Sync table row's ID with the actual Supabase Auth User ID to guarantee perfect permission flows
        if (authUser && sData.id !== authUser.id) {
          await supabase.from('profiles_siswa').update({ id: authUser.id }).eq('id', sData.id);
          sData.id = authUser.id;
        }

        await supabase.from('profiles_siswa').update({ is_online: true }).eq('id', sData.id);
        
        localStorage.setItem('userRole', 'Siswa');
        localStorage.setItem('studentName', sData.nama || 'Siswa');
        localStorage.setItem('studentId', sData.id);
        localStorage.setItem('studentNisn', sData.nisn);
        localStorage.setItem('studentClass', sData.class || 'Paket C');
        
        navigate('/dashboard');
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Jalur Admin/Guru (Email)
    if (!emailUtama || !passwordUtama) {
      alert("Email atau password tidak boleh kosong!");
      setIsLoading(false);
      return;
    }

    const emailLower = emailUtama.toLowerCase().trim();

    try {
      // 2a. Auto-signUp & Sinkronisasi Real-Time untuk Guru yang baru terdaftar di database
      if (loginRole === 'Guru') {
        const { data: gData } = await supabase
          .from('profiles_guru')
          .select('*')
          .eq('email', emailLower)
          .maybeSingle();

        if (gData) {
          const expectedPassword = gData.password || '123456';
          if (passwordUtama === expectedPassword) {
            // Coba login
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
              email: emailLower,
              password: passwordUtama
            });

            let authUser = authData?.user;

            if (signInError) {
              // Jika Guru belum terdaftar di Supabase Auth, daftarkan secara otomatis demi full Read-Write session
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: emailLower,
                password: passwordUtama,
                options: {
                  data: {
                    role: 'Guru'
                  }
                }
              });

              if (signUpError) console.error('Auto Guru Signup error:', signUpError);

              const { data: reSignInData, error: reSignInError } = await supabase.auth.signInWithPassword({
                email: emailLower,
                password: passwordUtama
              });

              if (!reSignInError) {
                authUser = reSignInData.user;
              }
            }

            // Sync database ID dengan Auth ID
            if (authUser && gData.id !== authUser.id) {
              await supabase.from('profiles_guru').update({ id: authUser.id }).eq('id', gData.id);
            }
          }
        }
      }

      // 2b. Auto-signUp & Sinkronisasi Real-Time untuk Admin Sekolah yang baru terdaftar di database
      if (loginRole === 'Admin') {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailLower)
          .maybeSingle();

        if (pData) {
          const isStandardPassword = passwordUtama === '123456' || passwordUtama === '12345678' || passwordUtama === 'DemoAccount123!' || passwordUtama === 'DEMOACCOUNT123!';
          if (isStandardPassword) {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
              email: emailLower,
              password: passwordUtama
            });

            let authUser = authData?.user;

            if (signInError) {
              // Jika Akun Admin belum terdaftar di Supabase Auth, daftarkan secara otomatis demi full Read-Write session
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: emailLower,
                password: passwordUtama,
                options: {
                  data: {
                    role: pData.role || 'Admin'
                  }
                }
              });

              if (signUpError) console.error('Auto Admin Signup error:', signUpError);

              const { data: reSignInData, error: reSignInError } = await supabase.auth.signInWithPassword({
                email: emailLower,
                password: passwordUtama
              });

              if (!reSignInError) {
                authUser = reSignInData.user;
              }
            }

            // Sync database ID dengan Auth ID
            if (authUser && pData.id !== authUser.id) {
              await supabase.from('profiles').update({ id: authUser.id }).eq('id', pData.id);
            }
          }
        }
      }

      // 2c. Logis Supabase Auth Standard
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailLower, 
        password: passwordUtama 
      });

      if (error) {
        // Fallback Khusus Owner untuk akun admin master jika belum terdaftar sama sekali
        if (emailLower === 'pkbmarmillanusa@gmail.com' || emailLower === 'ismanto095@gmail.com') {
          const bypassRole = emailLower === 'ismanto095@gmail.com' ? 'SuperAdmin' : 'Admin';
          
          // Cobalah untuk mendaftarkannya terlebih dahulu agar memiliki auth session nyata
          const { data: masterSignUp } = await supabase.auth.signUp({
            email: emailLower,
            password: passwordUtama,
            options: { data: { role: bypassRole } }
          }).catch(() => ({ data: null }));

          const { data: masterAuth } = await supabase.auth.signInWithPassword({
            email: emailLower,
            password: passwordUtama
          }).catch(() => ({ data: null }));

          if (masterAuth?.user) {
            localStorage.setItem('userEmail', emailLower);
            localStorage.setItem('userRole', bypassRole);
            localStorage.setItem('adminName', bypassRole === 'SuperAdmin' ? 'Administrator' : 'Admin PKBM Armilla');
            navigate('/dashboard');
            return;
          }
        }

        alert(error.message);
        setIsLoading(false);
        return;
      }

      // Login Normal Guru/Admin melalui data User
      if (data.user) {
        localStorage.setItem('userEmail', data.user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, nama, school_id')
          .or(`id.eq.${data.user.id},email.eq.${data.user.email}`)
          .maybeSingle();
        
        let finalRole = profile?.role || 'Guru';
        let profileName = profile?.nama || 'User';

        if (!profile) {
          const { data: guru } = await supabase
            .from('profiles_guru')
            .select('nama, email')
            .or(`id.eq.${data.user.id},email.eq.${data.user.email}`)
            .maybeSingle();

          if (guru) {
            finalRole = 'Guru';
            profileName = guru.nama;
            localStorage.setItem('teacherEmail', guru.email || '');
          }
        }

        localStorage.setItem('userRole', finalRole);
        if (finalRole === 'Admin' || finalRole === 'SuperAdmin') {
          localStorage.setItem('adminName', profileName);
        } else {
          localStorage.setItem('teacherName', profileName);
        }
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      alert(error.message);
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
              {/* Email/Password Form (Murni - No Hybrid DOM) */}
              {loginRole !== 'Siswa' ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">
                      Email Akun
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input 
                        name="email"
                        type="text" 
                        autoComplete="username email"
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        placeholder="nama@email.com"
                        required
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
                        name="password"
                        type={showPassword ? "text" : "password"} 
                        autoComplete="current-password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-12 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        placeholder="••••••••"
                        required
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
                </div>
              ) : (
                /* NISN Form (Murni - No Hybrid DOM) */
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">
                      Nomor NISN Siswa
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input 
                        name="nisn"
                        type="text" 
                        placeholder="Masukkan 10 digit NISN Anda"
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        required
                      />
                    </div>
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
