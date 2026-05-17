import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { summarizeContent, askAssistant } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';

const MOCK_COURSE = {
  id: '1',
  title: 'Bahasa Indonesia - Paket C',
  instructor: 'Dra. Siti Aminah',
  modules: [
    { 
      id: 'm1', 
      title: 'Menyusun Laporan Hasil Observasi', 
      content: 'Teks laporan hasil observasi adalah teks yang memberikan informasi secara umum tentang sesuatu berdasarkan fakta dari hasil pengamatan secara langsung. Struktur utamanya meliputi pernyataan umum, deskripsi bagian, dan deskripsi manfaat.',
      isCompleted: true 
    },
    { 
      id: 'm2', 
      title: 'Kebahasaan Teks Eksposisi', 
      content: 'Teks eksposisi bertujuan untuk meyakinkan pembaca melalui argumen yang kuat. Unsur kebahasaannya meliputi penggunaan pronomina (kata ganti), konjungsi, dan verba persepsi.',
      isCompleted: false 
    },
    { 
      id: 'm3', 
      title: 'Menganalisis Drama', 
      content: 'Unsur intrinsik drama meliputi tema, alur, tokoh, penokohan, latar, dan amanat. Dialog adalah unsur yang paling krusial dalam sebuah naskah drama.',
      isCompleted: false 
    }
  ]
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [question, setQuestion] = useState('');

  const currentModule = MOCK_COURSE.modules[activeModuleIdx];

  const handleSummarize = async () => {
    setIsAiLoading(true);
    setAiResponse(null);
    const summary = await summarizeContent(currentModule.content);
    setAiResponse(summary);
    setIsAiLoading(false);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsAiLoading(true);
    const answer = await askAssistant(currentModule.content, question);
    setAiResponse(answer);
    setQuestion('');
    setIsAiLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-brand-text-muted transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-brand-text-main">{MOCK_COURSE.title}</h2>
          <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest">Modul {activeModuleIdx + 1} dari {MOCK_COURSE.modules.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Module Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-brand-border bg-slate-50/50">
              <h3 className="text-sm font-bold text-brand-text-main">{currentModule.title}</h3>
            </div>
            <div className="p-8">
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="text-brand-text-main leading-relaxed text-sm">
                  {currentModule.content}
                </p>
              </div>
              
              <div className="flex justify-between mt-10 pt-6 border-t border-brand-border">
                <button 
                  disabled={activeModuleIdx === 0}
                  onClick={() => setActiveModuleIdx(prev => prev - 1)}
                  className="flex items-center gap-2 text-brand-text-muted disabled:opacity-30 font-bold text-[11px] px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>
                <button 
                  disabled={activeModuleIdx === MOCK_COURSE.modules.length - 1}
                  onClick={() => setActiveModuleIdx(prev => prev + 1)}
                  className="flex items-center gap-2 text-white disabled:opacity-30 font-bold text-[11px] px-4 py-1.5 bg-brand-accent hover:bg-brand-accent/90 rounded-lg transition-all"
                >
                  Modul Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Panel - Themes with HD Sidebar colors */}
          <div className="bg-brand-sidebar rounded-xl p-6 text-white border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-accent rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">AI Assistant</h4>
                  <p className="text-[10px] text-slate-400">Diskusi materi modul</p>
                </div>
              </div>
              <button 
                onClick={handleSummarize}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all"
              >
                Rangkum
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isAiLoading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 py-3"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berpikir...</span>
                  </motion.div>
                ) : aiResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 text-[11px] leading-relaxed text-slate-200"
                  >
                    <div className="whitespace-pre-line">
                      {aiResponse}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAsk} className="relative mt-2">
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tanya sesuatu..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-4 pr-12 text-[11px] placeholder:text-slate-500 outline-none focus:border-brand-accent transition-all"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 bg-brand-accent text-white rounded-md hover:bg-brand-accent/90 transition-all"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-brand-text-main uppercase tracking-widest px-2">Daftar Modul</h3>
          <div className="bg-white rounded-xl border border-brand-border p-2">
            <div className="space-y-1">
              {MOCK_COURSE.modules.map((mod, idx) => (
                <button
                  key={mod.id}
                  onClick={() => setActiveModuleIdx(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                    activeModuleIdx === idx 
                      ? "bg-brand-bg border border-brand-border" 
                      : "text-brand-text-muted hover:bg-slate-50"
                  )}
                >
                  {mod.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      activeModuleIdx === idx ? "text-brand-accent" : "text-slate-300"
                    )} />
                  )}
                  <div className="min-w-0">
                    <p className={cn(
                      "text-[11px] font-bold truncate",
                      activeModuleIdx === idx ? "text-brand-text-main" : "text-brand-text-muted"
                    )}>
                      {mod.title}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">10 Menit</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
