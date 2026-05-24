import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ExternalLink, 
  FileText, 
  Plus, 
  Filter, 
  Download, 
  Globe, 
  Search,
  BookMarked,
  Library,
  Upload,
  Link as LinkIcon,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

type ProgramLevel = 'Paket A' | 'Paket B' | 'Paket C';

interface Module {
  id: string;
  title: string;
  subject: string;
  level: ProgramLevel;
  type: 'Internal' | 'Official';
  file_url?: string;
  link_url?: string;
  created_at: string;
}

export default function ModulKesetaraan() {
  const [activeTab, setActiveTab] = useState<'official' | 'internal'>('official');
  const [activeFilter, setActiveFilter] = useState<ProgramLevel | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [role, setRole] = useState<string | null>(localStorage.getItem('userRole'));

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    level: 'Paket C' as ProgramLevel,
    file_url: '',
    link_type: 'file' as 'file' | 'link'
  });

  useEffect(() => {
    fetchModules();
  }, [activeFilter]);

  const fetchModules = async () => {
    let query = supabase.from('modul_kesetaraan').select('*');
    if (activeFilter !== 'All') {
      query = query.eq('level', activeFilter);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (data) setModules(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('modul_kesetaraan').insert([{
        title: formData.title,
        subject: formData.subject,
        level: formData.level,
        type: 'Internal',
        [formData.link_type === 'file' ? 'file_url' : 'link_url']: formData.file_url
      }]);

      if (error) throw error;
      toast.success('Modul berhasil diunggah!');
      setIsModalOpen(false);
      fetchModules();
    } catch (err: any) {
      toast.error('Gagal simpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const officialSources = [
    { name: 'E-Modul Kesetaraan (Direktorat PMPK)', url: 'https://emodul.kemdikbud.go.id/', desc: 'Kumpulan Buku Teks Digital Resmi Kemendikbudristek untuk Paket A, B, dan C.' },
    { name: 'Rumah Belajar', url: 'https://belajar.kemdikbud.go.id/', desc: 'Konten pembelajaran interaktif standar nasional.' },
    { name: 'Sibi (Sistem Informasi Perbukuan)', url: 'https://buku.kemdikbud.go.id/', desc: 'Akses buku teks kurikulum merdeka dan K13.' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-sidebar uppercase italic tracking-tighter flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
              <BookMarked className="w-7 h-7" />
            </div>
            Modul <span className="text-brand-accent">Kesetaraan</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.15em] ml-16">Pusat Sumber Belajar Digital PKBM Armilla</p>
        </div>

        {(role === 'Admin' || role === 'SuperAdmin' || role === 'Guru') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-sidebar text-white py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl hover:bg-brand-accent transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Upload Modul Internal
          </button>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border-b pb-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('official')}
            className={cn(
              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'official' ? "bg-white text-brand-sidebar shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Modul Resmi Kemendikbud
          </button>
          <button 
            onClick={() => setActiveTab('internal')}
            className={cn(
              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'internal' ? "bg-white text-brand-sidebar shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Modul Internal PKBM
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {['All', 'Paket A', 'Paket B', 'Paket C'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveFilter(lvl as any)}
              className={cn(
                "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0",
                activeFilter === lvl 
                  ? "bg-brand-accent/10 border-brand-accent text-brand-accent shadow-sm" 
                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='wait'>
          {activeTab === 'official' ? (
            officialSources.map((source, idx) => (
              <motion.div
                key={source.url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Globe className="w-20 h-20 rotate-12" />
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-brand-accent transition-colors">
                  {source.name}
                </h3>
                <p className="text-xs text-slate-500 font-bold mb-8 leading-relaxed">
                  {source.desc}
                </p>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[9px] font-black text-brand-sidebar uppercase tracking-[0.2em] bg-slate-50 py-3 px-6 rounded-xl group-hover:bg-brand-sidebar group-hover:text-white transition-all shadow-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buka Portal Resmi
                </a>
              </motion.div>
            ))
          ) : (
            modules.length > 0 ? modules.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl relative group hover:-translate-y-1 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-slate-100 text-slate-400 py-1.5 px-3 rounded-lg">
                    {item.level}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                  {item.title}
                </h3>
                <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-6">
                  {item.subject}
                </p>
                
                <div className="flex gap-2">
                  {item.file_url && (
                    <a 
                      href={item.file_url} 
                      target="_blank" 
                      className="flex-1 bg-brand-sidebar text-white py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-center shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                  {item.link_url && (
                    <a 
                      href={item.link_url} 
                      target="_blank" 
                      className="flex-1 bg-slate-100 text-slate-600 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3" /> Link Drive
                    </a>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                  <Library className="w-10 h-10" />
                </div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Belum ada modul internal diunggah</h4>
                <p className="text-[9px] font-bold text-slate-300 mt-2">Silakan hubungi pengelola untuk ketersediaan materi.</p>
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-black text-brand-sidebar uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                <Upload className="w-6 h-6 text-brand-accent" />
                Upload <span className="text-brand-accent">Modul Baru</span>
              </h2>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Modul</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: Matematika Persiapan Ujian"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mapel</label>
                    <input 
                      type="text" 
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Input Mata Pelajaran"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold focus:border-brand-accent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenjang</label>
                    <select 
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value as any})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold focus:border-brand-accent outline-none appearance-none"
                    >
                      <option>Paket A</option>
                      <option>Paket B</option>
                      <option>Paket C</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, link_type: 'file'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        formData.link_type === 'file' ? "bg-brand-sidebar text-white shadow-lg" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <FileText className="w-3 h-3" /> Direct File
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, link_type: 'link'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        formData.link_type === 'link' ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <LinkIcon className="w-3 h-3" /> Google Drive / Link
                    </button>
                  </div>
                  <input 
                    type="url" 
                    required
                    value={formData.file_url}
                    onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                    placeholder={formData.link_type === 'file' ? "Paste URL File PDF" : "Paste URL Google Drive / YouTube"}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-700 active:scale-95 transition-all mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Sumber Belajar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
