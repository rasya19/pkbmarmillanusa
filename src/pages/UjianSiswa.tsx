import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Flag, MonitorPlay, Check, Rocket, Loader2, Trophy, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

// Interfaces for real data
interface Soal {
  id: string;
  bank_soal_id: string;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  opsi_e: string;
  kunci_jawaban: string;
}

interface BankSoal {
  id: string;
  nama_ujian: string;
  mata_pelajaran: string;
  durasi: number;
}

export default function UjianSiswa() {
  const { id: bankSoalId } = useParams();
  const navigate = useNavigate();
  
  const [bankSoal, setBankSoal] = useState<BankSoal | null>(null);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [raguRagu, setRaguRagu] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [integrityChecked, setIntegrityChecked] = useState(false);

  const studentId = localStorage.getItem('studentId') || 'demo-siswa-1';
  const studentName = localStorage.getItem('studentName') || 'Siswa';
  const studentNisn = localStorage.getItem('studentNisn') || '19201001';

  // Load Initial Data
  useEffect(() => {
    if (bankSoalId) {
      loadExamData();
    }
  }, [bankSoalId]);

  const loadExamData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Bank Soal Metadata
      const { data: bData, error: bError } = await supabase
        .from('bank_soal')
        .select('*')
        .eq('id', bankSoalId)
        .single();
      
      if (bError) throw bError;
      setBankSoal(bData);
      setTimeLeft(bData.durasi * 60);

      // 2. Fetch Soal List
      const { data: sData, error: sError } = await supabase
        .from('butir_soal')
        .select('*')
        .eq('bank_soal_id', bankSoalId)
        .order('id', { ascending: true });

      if (sError) throw sError;
      
      const soalCount = bData.jumlah_soal || sData?.length || 0;
      setSoalList((sData || []).slice(0, soalCount));

      // 3. Fetch Existing Answers (Load Save State)
      const { data: aData, error: aError } = await supabase
        .from('jawaban_siswa')
        .select('*')
        .eq('student_id', studentId)
        .eq('bank_soal_id', bankSoalId);

      let earliestTime = Date.now();
      const existingAnswers: Record<string, string> = {};
      const existingRagu: Record<string, boolean> = {};

      if (!aError && aData && aData.length > 0) {
        aData.forEach(ans => {
          existingAnswers[ans.soal_id] = ans.jawaban;
          existingRagu[ans.soal_id] = ans.is_ragu;
          const time = new Date(ans.created_at || ans.updated_at).getTime();
          if (time < earliestTime) earliestTime = time;
        });
        setAnswers(existingAnswers);
        setRaguRagu(existingRagu);

        // Resume Timer Logic
        const elapsedSecs = Math.floor((Date.now() - earliestTime) / 1000);
        const remaining = Math.max(0, (bData.durasi * 60) - elapsedSecs);
        setTimeLeft(remaining);

        // Find the first unanswered question to jump to
        if (sData && sData.length > 0) {
          const firstUnansweredIndex = sData.findIndex(s => !existingAnswers[s.id]);
          if (firstUnansweredIndex !== -1) {
            setCurrentIdx(firstUnansweredIndex);
          } else {
            setCurrentIdx(sData.length - 1);
          }
        }
      } else {
        // First time starting
        setTimeLeft(bData.durasi * 60);
      }

    } catch (err) {
      console.error('Error loading exam data:', err);
      alert('Gagal memuat data ujian. Silakan coba lagi.');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSoal = soalList[currentIdx];

  // Auto Save Logic
  const autoSave = async (soalId: string, jawaban: string, isRagu: boolean) => {
    try {
      await supabase
        .from('jawaban_siswa')
        .upsert({
          student_id: studentId,
          bank_soal_id: bankSoalId,
          soal_id: soalId,
          jawaban: jawaban,
          is_ragu: isRagu,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,soal_id' });
    } catch (err) {
      console.error('Error auto-saving:', err);
    }
  };

  // Timer Countdown
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [hasStarted]);

  // Auto-submit when time is up
  useEffect(() => {
    if (hasStarted && timeLeft === 0 && !isSubmitting) {
      if (showConfirmModal) setShowConfirmModal(false);
      handleSubmit();
    }
  }, [timeLeft, hasStarted, isSubmitting]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (opsiId: string) => {
    if (!activeSoal) return;
    const newAnswers = { ...answers, [activeSoal.id]: opsiId };
    setAnswers(newAnswers);
    
    // Auto reset ragu if answered (logic decision)
    const isRagu = raguRagu[activeSoal.id] || false;
    autoSave(activeSoal.id, opsiId, isRagu);
  };

  const toggleRagu = () => {
    if (!activeSoal) return;
    const newValue = !raguRagu[activeSoal.id];
    setRaguRagu({ ...raguRagu, [activeSoal.id]: newValue });
    autoSave(activeSoal.id, answers[activeSoal.id] || '', newValue);
  };

  const handleNext = () => {
    if (currentIdx < soalList.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const jumpTo = (index: number) => {
    setCurrentIdx(index);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const startExam = async () => {
    // Check if already finished
    try {
      const { data, error } = await supabase
        .from('hasil_ujian')
        .select('*')
        .eq('student_id', studentId)
        .eq('bank_soal_id', bankSoalId)
        .maybeSingle();

      if (data) {
        toast.error('Anda sudah menyelesaikan ujian ini. Tidak diperbolehkan masuk kembali.');
        navigate('/dashboard/ujian');
        return;
      }
    } catch (err) {
      console.error('Check failed:', err);
    }

    if (!document.fullscreenElement) {
       document.documentElement.requestFullscreen().catch(() => {
          console.warn('Fullscreen denied');
       });
    }
    setHasStarted(true);
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Prevent leaving fullscreen or closing tab
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted]);

  const handleManualSubmitClick = () => {
    setIntegrityChecked(false);
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (showConfirmModal) {
      setShowConfirmModal(false);
    }

    setIsSubmitting(true);
    try {
      // 1. Logic Scoring
      let correctCount = 0;
      soalList.forEach((soal) => {
        if (answers[soal.id] === soal.kunci_jawaban) {
          correctCount++;
        }
      });

      const totalSoal = soalList.length;
      const score = totalSoal > 0 ? (correctCount / totalSoal) * 100 : 0;

      // 2. Save result to database
      const { error } = await supabase
        .from('nilai_ujian')
        .insert([{
          siswa_id: studentId,
          bank_soal_id: bankSoalId,
          skor_akhir: Math.round(score),
          waktu_selesai: new Date().toISOString()
        }]);

      if (error) throw error;

      // Unlock device / set is_online to false
      await supabase.from('profiles_siswa').update({ is_online: false }).eq('id', studentId);

      setResultData({
        score: Math.round(score),
        correct: correctCount,
        incorrect: totalSoal - correctCount,
        total: totalSoal,
        examName: bankSoal?.nama_ujian,
        subject: bankSoal?.mata_pelajaran
      });

      if (document.fullscreenElement && document.exitFullscreen) {
         document.exitFullscreen();
      }
      setShowResultCard(true);
    } catch (err) {
      console.error('Error submitting exam:', err);
      alert('Gagal menyimpan hasil ujian. Hubungi pengawas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mb-4" />
        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest animate-pulse">Menyiapkan Soal Ujian...</p>
      </div>
    );
  }

  // Result Card Overlay
  if (showResultCard && resultData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl relative print:shadow-none print:rounded-none"
        >
           {/* Certificate Header */}
           <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
              
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                 <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Hasil Ujian Anda</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Certificate of Completion</p>
           </div>

           <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Siswa</p>
                    <p className="text-base font-black text-slate-800 uppercase italic">{studentName}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NISN Peserta</p>
                    <p className="text-base font-black text-slate-800 uppercase italic">{studentNisn}</p>
                 </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-center relative">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mata Pelajaran: {resultData.subject}</p>
                 <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight mb-8">"{resultData.examName}"</h3>
                 
                 <div className="flex items-center justify-center gap-12">
                    <div className="space-y-3 text-left">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="text-xs font-bold text-slate-600">Benar: <span className="font-black text-slate-900">{resultData.correct}</span></p>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <p className="text-xs font-bold text-slate-600">Salah: <span className="font-black text-slate-900">{resultData.incorrect}</span></p>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          <p className="text-xs font-bold text-slate-600">Total: <span className="font-black text-slate-900">{resultData.total}</span></p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 no-print">
                 <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                 >
                    <Download className="w-4 h-4" /> Cetak Hasil Ujian
                 </button>
                 <button 
                  onClick={() => navigate('/dashboard/ujian')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
                 >
                    Kembali ke Dashboard <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </motion.div>
      </div>
    );
  }
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
         <div className="max-w-md w-full bg-slate-800 p-10 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
               <MonitorPlay className="w-10 h-10 ml-1" />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">{bankSoal?.nama_ujian}</h1>
            <p className="text-sm text-slate-400 mb-4 font-medium uppercase tracking-widest">{bankSoal?.mata_pelajaran}</p>
            <div className="flex items-center justify-center gap-6 mb-10">
               <div className="text-center">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Durasi</p>
                  <p className="text-sm font-black text-white">{bankSoal?.durasi} Menit</p>
               </div>
               <div className="w-px h-8 bg-slate-700" />
               <div className="text-center">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Jumlah Soal</p>
                  <p className="text-sm font-black text-white">{soalList.length} Butir</p>
               </div>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 mb-8 text-left">
               <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 italic">Peringatan Anti-Cheat:</h4>
               <ul className="space-y-2">
                 <li className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                   <Check className="w-3 h-3 text-emerald-500" /> Mode Layar Penuh akan diaktifkan
                 </li>
                 <li className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                   <Check className="w-3 h-3 text-emerald-500" /> Terdeteksi pindah Tab = Diskualifikasi
                 </li>
                 <li className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                   <Check className="w-3 h-3 text-emerald-500" /> Fitur Auto-Save aktif otomatis
                 </li>
               </ul>
            </div>

            <button 
              onClick={startExam}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Rocket className="w-5 h-5 relative z-10" /> <span className="relative z-10">Mulai Ujian Sekarang</span>
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="w-full mt-4 text-slate-400 hover:text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              Kembali
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-slate-950 border-b border-emerald-900/50 h-16 shrink-0 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <MonitorPlay className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white leading-tight">{bankSoal?.nama_ujian}</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">{bankSoal?.mata_pelajaran}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Peserta Ujian</p>
            <p className="text-sm font-bold text-white uppercase italic">{studentName} ({studentNisn})</p>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl border text-xl font-mono font-black shadow-[0_0_20px_rgba(16,185,129,0.1)]",
            timeLeft < 300 
              ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          )}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>

          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"
          >
            <MonitorPlay className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Area - Question */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto custom-scrollbar relative p-4 sm:p-6 lg:p-10 hide-scrollbar">
          <div className="max-w-4xl w-full mx-auto pb-32">
            
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-white italic">Soal Nomor {currentIdx + 1}</h2>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full border bg-slate-800/50 text-slate-400 border-slate-700 italic">
                Sisa: {soalList.length - currentIdx - 1} Soal
              </span>
            </div>

            {activeSoal && (
              <>
                <div className="text-base sm:text-lg md:text-xl font-bold text-slate-200 leading-relaxed mb-6 sm:mb-10 bg-slate-800/20 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-800/50">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {activeSoal.pertanyaan}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 pb-10">
                  {[
                    { id: 'A', teks: activeSoal.opsi_a },
                    { id: 'B', teks: activeSoal.opsi_b },
                    { id: 'C', teks: activeSoal.opsi_c },
                    { id: 'D', teks: activeSoal.opsi_d },
                    { id: 'E', teks: activeSoal.opsi_e },
                  ].filter(o => o.teks).map((opsi) => {
                    const isSelected = answers[activeSoal.id] === opsi.id;
                    return (
                      <label 
                        key={opsi.id}
                        className={cn(
                          "flex items-start gap-3 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden select-none active:scale-[0.98]",
                          isSelected 
                            ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]" 
                            : "bg-slate-800/50 border-slate-800"
                        )}
                      >
                        <input 
                          type="radio" 
                          name={`soal-${activeSoal.id}`}
                          value={opsi.id}
                          checked={isSelected}
                          onChange={() => handleAnswer(opsi.id)}
                          className="peer sr-only"
                        />
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all text-xs sm:text-sm font-black",
                          isSelected 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : "border-slate-700 text-slate-500"
                        )}>
                          {isSelected ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : opsi.id}
                        </div>
                        <div className={cn(
                          "text-sm sm:text-base md:text-lg pt-1 sm:pt-2 transition-colors flex-1 m-markdown-container",
                          isSelected ? "text-emerald-50 font-black italic" : "text-slate-400 font-bold"
                        )}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {opsi.teks}
                          </ReactMarkdown>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </main>

        {/* Right Area - Grid Navigation */}
        <aside className="w-full lg:w-80 shrink-0 bg-slate-950 border-t lg:border-t-0 lg:border-l border-emerald-900/30 flex flex-col h-[280px] sm:h-[320px] lg:h-auto overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-emerald-900/30 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest italic">Peta Navigasi</h3>
            <div className="text-[9px] sm:text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 tracking-tighter">
              {Object.keys(answers).length} / {soalList.length} Terjawab
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar hide-scrollbar">
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 sm:gap-3">
              {soalList.map((s, idx) => {
                const isAnswered = !!answers[s.id];
                const isRagu = !!raguRagu[s.id];
                const isActive = currentIdx === idx;

                return (
                  <button
                    key={s.id}
                    onClick={() => jumpTo(idx)}
                    className={cn(
                      "aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black relative overflow-hidden transition-all shadow-sm active:scale-90",
                      isActive && !isAnswered && !isRagu ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 scale-110 z-10" : "",
                      isAnswered && !isRagu ? "bg-emerald-500 text-white shadow-emerald-500/20" : "",
                      isRagu ? "bg-amber-500 text-white shadow-amber-500/20" : "",
                      !isAnswered && !isRagu && !isActive ? "bg-slate-800 text-slate-500 hover:bg-slate-700" : "",
                      isActive && (isAnswered || isRagu) ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 z-10" : ""
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 border-t border-emerald-900/30 bg-slate-900/50 space-y-2 sm:space-y-3 hidden sm:block">
            <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
              <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-lg shadow-emerald-500/20" /> Sudah Dijawab
            </div>
            <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
              <div className="w-4 h-4 rounded-md bg-amber-500 shadow-lg shadow-amber-500/20" /> Ragu-ragu
            </div>
            <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
              <div className="w-4 h-4 rounded-md border border-slate-700 bg-slate-800 shadow-lg shadow-black/20" /> Belum Dijawab
            </div>
          </div>
        </aside>

      </div>

      {/* Footer Navigation */}
      <footer className="bg-slate-950 border-t border-emerald-900/50 h-20 sm:h-24 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-50">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl"
          >
            <ChevronLeft className="w-4 h-4 sm:group-hover:-translate-x-1 transition-transform" /> <span className="hidden md:inline">Soal Sebelumnya</span>
          </button>
        </div>

        <button
          onClick={toggleRagu}
          className={cn(
            "flex items-center gap-2 sm:gap-3 px-4 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border-2 shadow-xl",
            activeSoal && raguRagu[activeSoal.id] 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
              : "bg-transparent text-amber-500 border-amber-500/10 hover:bg-amber-500/10"
          )}
        >
          <Flag className={cn("w-3 h-3 sm:w-4 sm:h-4", activeSoal && raguRagu[activeSoal.id] ? "fill-amber-400" : "")} /> 
          <span>Ragu-ragu</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          {currentIdx === soalList.length - 1 ? (
             <button
              onClick={handleManualSubmitClick}
              disabled={isSubmitting}
              className="flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xl shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Selesai
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all bg-slate-200 text-slate-900 hover:bg-white shadow-2xl shadow-white/10 active:scale-95 group"
            >
              <span className="hidden md:inline">Selanjutnya</span> <ChevronRight className="w-4 h-4 sm:group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </footer>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white italic tracking-tight">Akhiri Ujian?</h3>
                  <p className="text-sm font-medium text-slate-400 mt-2">
                    Anda masih memiliki <span className="font-black text-red-400">{soalList.length - Object.keys(answers).length} soal</span> yang belum dijawab. 
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={integrityChecked}
                  onChange={(e) => setIntegrityChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-emerald-500 rounded"
                />
                <span className="text-xs font-medium text-slate-300">
                  Saya yakin dan setuju untuk mengakhiri ujian sekarang. Saya bertanggung jawab atas semua jawaban yang telah saya berikan.
                </span>
              </label>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!integrityChecked || isSubmitting}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Selesai"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
