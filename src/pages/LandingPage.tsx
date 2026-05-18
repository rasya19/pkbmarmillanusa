import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSchool } from '../contexts/SchoolContext';
import { 
  ShieldCheck, 
  ArrowRight,
  Users,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { school, loading } = useSchool();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const schoolName = school?.name || 'PKBM ARMILLA NUSA';
  const logoUrl = school?.logoUrl;

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden relative z-10"
      >
        {/* Left Side: Branding */}
        <div className="p-12 lg:p-16 flex flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="mb-10">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={schoolName} 
                className="w-20 h-20 object-contain bg-white rounded-2xl p-2 shadow-xl shadow-emerald-500/10 mb-8"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-emerald-600/20">
                <GraduationCap className="w-8 h-8" />
              </div>
            )}
            <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
              LMS Portal <br />
              <span className="text-emerald-400">{schoolName}</span>
            </h1>
            <p className="text-slate-400 font-medium italic text-sm leading-relaxed max-w-xs">
              Selamat datang di Sistem Manajemen Pembelajaran Terintegrasi. Silakan masuk untuk mengakses fitur akademik.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-8 border-t border-slate-800">
            Powered by <span className="text-emerald-500">RASYATECH</span>
          </div>
        </div>

        {/* Right Side: Quick Access Portal */}
        <div className="p-12 lg:p-16 bg-slate-800/50 flex flex-col justify-center border-l border-slate-700/50">
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 italic">Pilih Jalur Akses:</h2>
            
            <Link 
              to="/login" 
              className="group w-full bg-slate-900 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 p-6 rounded-3xl transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-white/10 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase tracking-widest group-hover:translate-x-1 transition-transform">Masuk Admin</p>
                  <p className="text-[10px] text-slate-500 group-hover:text-emerald-100 italic transition-colors">Pengelolaan Web & Guru</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
            </Link>

            <Link 
              to="/login" 
              className="group w-full bg-slate-900 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 p-6 rounded-3xl transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-white/10 transition-colors">
                  <Users className="w-6 h-6 text-emerald-400 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase tracking-widest group-hover:translate-x-1 transition-transform">Masuk Guru</p>
                  <p className="text-[10px] text-slate-500 group-hover:text-emerald-100 italic transition-colors">Presensi & Pengajaran</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
            </Link>

            <Link 
              to="/login" 
              className="group w-full bg-emerald-600 hover:bg-emerald-500 p-6 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-xl shadow-emerald-600/20"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase tracking-widest group-hover:translate-x-1 transition-transform">Masuk Siswa</p>
                  <p className="text-[10px] text-emerald-100 italic">E-Learning & Ujian Online</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-2 transition-all" />
            </Link>
          </div>

          <p className="mt-12 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
            Hubungi Admin Sekolah jika bermasalah dengan akses.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
