import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight, Activity, XCircle, AlertCircle,
  FileText, Wallet, Rocket, Trophy, Calendar, Download, RefreshCcw, RotateCcw,
  BookOpen, MapPin, ClipboardList, ChevronRight, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import StudentCard from '../components/StudentCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Global Data (Dihuni dari Akademik.tsx)
const DUMMY_SCHEDULE = [
  {
    id: 'J001',
    hari: 'Senin',
    mulai: '08:00',
    selesai: '09:30',
    kelas: 'Kelas 10 - Paket C',
    mapel: 'Bahasa Indonesia',
    guru: 'Budi Santoso, S.Pd'
  },
  {
    id: 'J050',
    hari: 'Minggu', // Untuk testing hari ini
    mulai: '08:00',
    selesai: '10:00',
    kelas: 'Kelas 12 - Paket C',
    mapel: 'Matematika Terapan',
    guru: 'Ahmad Yani, S.S'
  },
  {
    id: 'J051',
    hari: 'Minggu',
    mulai: '10:00',
    selesai: '12:00',
    kelas: 'Kelas 12 - Paket C',
    mapel: 'Bahasa Inggris',
    guru: 'Budi Santoso, S.Pd'
  },
  {
    id: 'J002',
    hari: 'Senin',
    mulai: '09:45',
    selesai: '11:15',
    kelas: 'Kelas 10 - Paket C',
    mapel: 'Matematika',
    guru: 'Ahmad Yani, S.S'
  },
  {
    id: 'J003',
    hari: 'Senin',
    mulai: '08:00',
    selesai: '09:30',
    kelas: 'Kelas 11 - Paket C',
    mapel: 'Sosiologi',
    guru: 'Drs. Joko Widodo'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { school, isMasterDomain } = useSchool();
  const userRole = localStorage.getItem('userRole') || 'Siswa';
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
  const adminName = localStorage.getItem('adminName') || localStorage.getItem('teacherName') || (userRole === 'SuperAdmin' ? 'Master Admin' : 'Staf Pengajar');
  const studentName = localStorage.getItem('studentName') || 'Budi Santoso';
  const studentId = localStorage.getItem('studentId');
  const studentClass = localStorage.getItem('studentClass') || '12 - Paket C';

  useEffect(() => {
    if (userRole === 'SuperAdmin' && isMasterDomain) {
      navigate('/master-admin');
    }
  }, [userRole, isMasterDomain, navigate]);

  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalSiswa: '0',
    totalGuru: '0',
    totalUjian: '0',
    rataNilai: '0',
    mapelAktif: '0',
    tugasSelesai: '0'
  });

  const getIndonesianDay = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  const today = getIndonesianDay();
  const currentTime = new Date().getHours() * 100 + new Date().getMinutes();

  const todaySchedule = DUMMY_SCHEDULE.filter(s => s.hari === today);
  
  // Schedule for current user
  const mySchedule = userRole === 'Siswa' 
    ? todaySchedule.filter(s => s.kelas.includes(studentClass.split(' ')[0]))
    : todaySchedule.filter(s => s.guru === adminName || isAdmin);

  useEffect(() => {
    if (userRole === 'Siswa' && studentId) {
      fetchStudentDashboardData();
      fetchStudentProfile();
    } else if (isAdmin || userRole === 'Guru') {
      fetchAdminDashboardData();
    }
  }, [userRole, studentId, isAdmin]);

  const fetchStudentProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_siswa')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (!error && data) {
        setStudentProfile(data);
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Hapus SEMUA jawaban siswa dan hasil ujian sekarang? Tujuannya untuk memulai simulasi dari awal.')) return;
    try {
      const { error: err1 } = await supabase.from('jawaban_siswa').delete().neq('student_id', 'none');
      const { error: err2 } = await supabase.from('hasil_ujian').delete().neq('student_id', 'none');
      if (err1 || err2) throw (err1 || err2);
      toast.success('Database berhasil direset untuk simulasi baru.');
      fetchAdminDashboardData();
    } catch (err: any) {
      toast.error('Gagal reset: ' + err.message);
    }
  };

  const fetchAdminDashboardData = async () => {
    try {
      // Total Siswa
      const { count: siswaCount } = await supabase.from('profiles_siswa').select('*', { count: 'exact', head: true });
      // Total Guru
      const { count: guruCount } = await supabase.from('profiles_guru').select('*', { count: 'exact', head: true });
      // Total Ujian
      const { count: ujianCount } = await supabase.from('bank_soal').select('*', { count: 'exact', head: true });
      // Rata Nilai
      const { data: results } = await supabase.from('hasil_ujian').select('nilai');
      const avg = results && results.length > 0 
        ? Math.round(results.reduce((acc, curr) => acc + curr.nilai, 0) / results.length)
        : 0;

      setStats({
        totalSiswa: siswaCount?.toString() || '0',
        totalGuru: guruCount?.toString() || '0',
        totalUjian: ujianCount?.toString() || '0',
        rataNilai: avg.toString()
      });
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    }
  };

  const exportAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('hasil_ujian')
        .select(`
          nilai,
          end_time,
          profiles_siswa:student_id (nama, nisn, class),
          bank_soal (nama_ujian)
        `);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Belum ada data kehadiran ujian.');
        return;
      }

      const worksheetData = data.map((row: any) => {
        let predikat = 'Kurang';
        if (row.nilai >= 85) predikat = 'Sangat Baik';
        else if (row.nilai >= 70) predikat = 'Baik';
        else if (row.nilai >= 55) predikat = 'Cukup';

        return {
          'Nama Siswa': row.profiles_siswa?.[0]?.nama || row.profiles_siswa?.nama,
          'NISN': row.profiles_siswa?.[0]?.nisn || row.profiles_siswa?.nisn,
          'Kelas': row.profiles_siswa?.[0]?.class || row.profiles_siswa?.class,
          'Nama Ujian': row.bank_soal?.[0]?.nama_ujian || row.bank_soal?.nama_ujian,
          'Skor': row.nilai,
          'Predikat': predikat,
          'Waktu Selesai': new Date(row.end_time).toLocaleString('id-ID')
        };
      });

      const { utils, writeFile } = await import('xlsx');
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(worksheetData);
      utils.book_append_sheet(wb, ws, 'Kehadiran Ujian');
      writeFile(wb, `Laporan_Kehadiran_Ujian_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Laporan Kehadiran berhasil diunduh.');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Gagal mengekspor laporan.');
    }
  };

  const fetchStudentDashboardData = async () => {
    try {
      // Fetch recent exam results
      const { data, error } = await supabase
        .from('hasil_ujian')
        .select(`
          *,
          bank_soal (nama_ujian, mata_pelajaran)
        `)
        .eq('student_id', studentId)
        .order('end_time', { ascending: false })
        .limit(5);

      if (!error && data) {
        setStudentResults(data);
        setStats(prev => ({
          ...prev,
          tugasSelesai: `${data.length}`
        }));
      }
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    }
  };

  const handleDatabaseSync = async () => {
    try {
      // Find students who have finished the exam
      const { data: finished } = await supabase.from('hasil_ujian').select('student_id');
      if (finished && finished.length > 0) {
        const studentIds = finished.map(f => f.student_id).filter(Boolean);
        
        // Convert to unique array to avoid big IN clause redundancy
        const uniqueIds = Array.from(new Set(studentIds));

        // Update their is_online logic
        const { error } = await supabase
          .from('profiles_siswa')
          .update({ is_online: false })
          .in('id', uniqueIds)
          .eq('is_online', true);

        if (error) {
          console.warn('is_online column might not exist:', error.message);
          toast.success('Database di-sync. ' + (error.message.includes('column') ? '(Simulasi tanpa kolom is_online)' : ''));
        } else {
          toast.success('Database Sync berhasil. Status is_online siswa yang sudah selesai ujian kini di-reset menjadi false.');
        }
      } else {
         toast.info('Tidak ada siswa yang telah menyelesaikan ujian saat ini.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal melakukan sync database.');
    }
  };

  const isExpired = school?.expiryDate ? new Date(school.expiryDate) < new Date() : false;
  const isExpiringSoon = school?.expiryDate ? (new Date(school.expiryDate).getTime() - new Date().getTime()) < (7 * 24 * 60 * 60 * 1000) : false;

  return (
    <div className="space-y-6 max-w-6xl p-6 bg-slate-950 min-h-screen text-slate-100 rounded-3xl mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-50 tracking-tight">Halo, {userRole === 'Siswa' ? studentName : adminName}!</h2>
          <p className="text-sm font-medium text-emerald-400 mt-1 uppercase tracking-widest">Selamat Datang Kembali.</p>
        </div>
      </div>

      {/* Stat Cards */}
      {userRole !== 'Tamu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL SISWA', value: stats.totalSiswa, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
            { label: 'TOTAL GURU', value: stats.totalGuru, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
            ...(userRole !== 'Siswa' ? [
              { label: 'TOTAL UJIAN', value: stats.totalUjian, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
              { label: 'RATA-RATA SKOR', value: stats.rataNilai, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' }
            ] : [
              { label: 'MAPEL AKTIF', value: stats.mapelAktif, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
              { label: 'UJIAN SELESAI', value: stats.tugasSelesai, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' }
            ])
          ].map((stat, i) => (
            <div
              key={i}
              className={cn("bg-slate-900/50 p-6 rounded-3xl border flex flex-col justify-between group hover:border-emerald-500/50 transition-colors", stat.border)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-50 tracking-tight">{stat.value}</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {userRole === 'Tamu' ? (
          <div className="lg:col-span-3">
             <div className="bg-slate-900/80 p-12 rounded-[3.5rem] border border-slate-800 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto py-12">
                   <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                      <Rocket className="w-10 h-10 text-emerald-400 animate-pulse" />
                   </div>
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">ANDA MASUK SEBAGAI <span className="text-emerald-400">TAMU</span></h3>
                   <p className="text-sm font-medium text-slate-400 mb-10 leading-relaxed">
                      Selamat datang di portal dashboard. Sebagai pengunjung tamu, akses Anda terbatas pada fitur komunikasi dan manajemen profil dasar. Untuk fitur akademik lengkap, silakan hubungi administrator sekolah.
                   </p>
                   <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link to="/dashboard/diskusi" className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all">
                         Lihat Diskusi & Bantuan
                      </Link>
                      <Link to="/dashboard/settings" className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-700 transition-all">
                         Pengaturan Akun
                      </Link>
                   </div>
                </div>
             </div>
          </div>
        ) : userRole === 'Siswa' ? (
          <>
            {/* Student Schedule & Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule for Student */}
              <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                 
                 <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                          <Clock className="w-6 h-6 text-emerald-400" />
                       </div>
                       <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Jadwal Pelajaran Hari Ini</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{today}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                       </div>
                    </div>
                    <Link to="/dashboard/akademik" className="p-2 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-emerald-400 transition-colors">
                       <ChevronRight className="w-5 h-5" />
                    </Link>
                 </div>

                 <div className="space-y-4 relative z-10">
                    {mySchedule.length === 0 ? (
                       <div className="py-6 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-800">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tidak ada jadwal hari ini</p>
                       </div>
                    ) : (
                       mySchedule.map((s, idx) => {
                          const start = parseInt(s.mulai.replace(':', ''));
                          const end = parseInt(s.selesai.replace(':', ''));
                          const isNow = currentTime >= start && currentTime <= end;
                          
                          return (
                            <div key={s.id} className={cn(
                              "flex items-center justify-between p-5 rounded-2xl border transition-all",
                              isNow ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5" : "bg-slate-800/30 border-slate-800/50 opacity-60"
                            )}>
                               <div className="flex items-center gap-5">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black",
                                    isNow ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-700 text-slate-400"
                                  )}>
                                     <span className="text-[10px] leading-tight">{s.mulai.split(':')[0]}</span>
                                     <span className="text-[10px] leading-tight">{s.mulai.split(':')[1]}</span>
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-black text-white italic uppercase tracking-tight">{s.mapel}</h4>
                                        {isNow && (
                                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full animate-pulse">Berlangsung</span>
                                        )}
                                     </div>
                                     <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase">
                                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {s.guru}</span>
                                        <span>• {s.mulai} - {s.selesai}</span>
                                     </div>
                                  </div>
                               </div>
                               <button className="text-emerald-400 hover:scale-110 transition-transform">
                                  <ArrowUpRight className="w-5 h-5" />
                                </button>
                            </div>
                          );
                       })
                    )}
                 </div>
              </div>

            {/* Next Exam Card */}
            <div className="bg-emerald-600 p-8 rounded-3xl relative overflow-hidden group shadow-2xl shadow-emerald-600/20">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10">
                 <Rocket className="w-10 h-10 text-white mb-6 animate-bounce" />
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight mb-2">SIAP UNTUK<br/>UJIAN LANJUTAN?</h3>
                 <p className="text-xs font-bold text-emerald-100 italic opacity-80 mb-8">Kerjakan sisa tugas dan ujian harian Anda hari ini untuk meningkatkan skor raport.</p>
                 <Link 
                   to="/dashboard/ujian" 
                   className="inline-flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
                 >
                   Ikut Ujian Sekarang <ArrowUpRight className="w-4 h-4" />
                 </Link>
               </div>
            </div>
          </div>

          {school?.subscription_plan === 'Platinum' && (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Kartu Pelajar Digital
              </h3>
              <StudentCard 
                student={{
                  id: studentProfile?.id || studentId || 'unknown',
                  nisn: studentProfile?.nisn || localStorage.getItem('studentNisn') || '0000000000',
                  nama: studentProfile?.nama || studentName,
                  class: studentProfile?.class || studentClass,
                  photourl: studentProfile?.photourl
                }}
                schoolName={school?.name || "PKBM ARMILLA NUSA"}
              />
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Skor Terkini
              </h4>
              {studentResults.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Belum ada skor ujian.</p>
              ) : (
                <div className="space-y-3">
                  {studentResults.map((res: any) => (
                    <div key={res.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800/50">
                      <div>
                        <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{res.bank_soal?.nama_ujian}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">{res.bank_soal?.mata_pelajaran}</p>
                      </div>
                      <div className="text-lg font-black text-emerald-400 italic">{res.nilai}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
          /* Admin View */
          <div className="lg:col-span-3 space-y-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-slate-900/80 rounded-[3rem] border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">Rekap Nilai <br/> <span className="text-emerald-400">Simulasi UNBK</span></h3>
                  <p className="text-xs font-medium text-slate-400 max-w-sm">Unduh rekapitulasi nilai seluruh siswa yang telah mengikuti simulasi dalam format Excel untuk evaluasi hasil belajar.</p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={exportAttendance}
                      className="bg-slate-50 text-slate-900 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-xl shadow-black/20 flex items-center gap-3"
                    >
                      <Download className="w-4 h-4" /> Download Rekap Simulasi (XLSX)
                    </button>
                    <button 
                      onClick={handleDatabaseSync}
                      className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl flex items-center gap-3"
                    >
                      <RefreshCcw className="w-4 h-4" /> Database Sync
                    </button>
                    <button 
                      onClick={handleResetAll}
                      className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl flex items-center gap-3"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset Semua Sesi
                    </button>
                  </div>
                </div>
                <div className="relative z-10 w-full md:w-auto">
                   <div className="grid grid-cols-2 gap-4">
                      <Link to="/dashboard/hasil-ujian" className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 hover:border-emerald-500/30 transition-all text-center">
                         <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                         <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Live Monitor</p>
                      </Link>
                      <Link to="/dashboard/settings" className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 hover:border-emerald-500/30 transition-all text-center">
                         <RotateCcw className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                         <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Reset Sesi</p>
                      </Link>
                   </div>
                </div>
             </div>

             {/* Attendance & Agenda Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col justify-between h-full">
                   <div>
                     <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl">
                             <Calendar className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                             <h3 className="text-sm font-black text-white uppercase tracking-widest">Jadwal Mengajar Hari Ini</h3>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{today}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                          </div>
                       </div>
                       <Link to="/dashboard/akademik" className="text-[9px] font-black text-slate-500 tracking-widest uppercase hover:text-emerald-400 transition-colors">Lihat Semua</Link>
                     </div>

                     <div className="space-y-4 mb-8">
                        {mySchedule.length === 0 ? (
                           <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-50">Tidak ada jadwal tercatat hari ini</p>
                           </div>
                        ) : (
                          mySchedule.map((s) => {
                            const start = parseInt(s.mulai.replace(':', ''));
                            const end = parseInt(s.selesai.replace(':', ''));
                            const isNow = currentTime >= start && currentTime <= end;

                            return (
                              <div key={s.id} className={cn(
                                "p-4 rounded-2xl border transition-all flex items-center justify-between group/item",
                                isNow ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800/30 border-slate-800/50 opacity-60"
                              )}>
                                 <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black",
                                      isNow ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                                    )}>
                                       {s.mulai.split(':')[0]}
                                    </div>
                                    <div>
                                       <h4 className="text-xs font-black text-white uppercase italic">{s.mapel}</h4>
                                       <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{s.kelas}</p>
                                          <span className="text-[8px] text-slate-600 font-bold tracking-widest">• {s.mulai} - {s.selesai}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-500 group-hover/item:text-emerald-400 transform group-hover/item:translate-x-1 transition-all" />
                              </div>
                            );
                          })
                        )}
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <Link 
                        to="/dashboard/presensi" 
                        className="bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center transition-all shadow-xl shadow-blue-600/20"
                      >
                        Buka Presensi
                      </Link>
                      <Link 
                        to="/dashboard/agenda" 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center transition-all shadow-xl shadow-emerald-600/20"
                      >
                        Catat Agenda
                      </Link>
                   </div>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
                   <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Status Kehadiran Terakhir
                   </h3>
                   <div className="space-y-4">
                      {[
                        { label: 'Hadir', count: stats.totalSiswa, color: 'emerald' },
                        { label: 'Sakit / Izin', count: '0', color: 'amber' },
                        { label: 'Alpa', count: '0', color: 'red' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                           <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", `bg-${item.color}-400`)} />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</p>
                           </div>
                           <p className="text-lg font-black text-white italic">{item.count} <span className="text-[10px] text-slate-500 not-italic">Siswa</span></p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

