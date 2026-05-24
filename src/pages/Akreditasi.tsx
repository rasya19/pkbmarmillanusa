import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderLock, 
  Search, 
  FolderOpen, 
  FileCheck, 
  ShieldCheck, 
  ChevronRight, 
  Upload, 
  MoreHorizontal,
  X,
  FileText,
  Download,
  Trash2,
  Lock,
  Plus,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const STANDARDS = [
  { id: 1, name: 'Standar Kelulusan', desc: 'SKL, Kompetensi Lulusan, Portofolio Lulusan.' },
  { id: 2, name: 'Standar Isi', desc: 'Kurikulum, Silabus, RPP, Kalender Pendidikan.' },
  { id: 3, name: 'Standar Proses', desc: 'Manajemen Kelas, Pelaksanaan Pembelajaran.' },
  { id: 4, name: 'Standar Penilaian', desc: 'Instrumen Penilaian, Hasil Belajar, Raport.' },
  { id: 5, name: 'Standar PTK', desc: 'Data Guru & Tenaga Kependidikan, SK, Sertifikasi.' },
  { id: 6, name: 'Standar Sarpras', desc: 'Inventaris Gedung, Alat Belajar, Fasilitas.' },
  { id: 7, name: 'Standar Pengelolaan', desc: 'RKJM, RKT, Struktur Organisasi, Administrasi.' },
  { id: 8, name: 'Standar Pembiayaan', desc: 'RKAS, Laporan Keuangan, SPJ, Buku Kas.' }
];

interface AccreditationDoc {
  id: string;
  standard_id: number;
  title: string;
  file_url: string;
  created_at: string;
  uploader: string;
}

export default function Akreditasi() {
  const [selectedStandard, setSelectedStandard] = useState<typeof STANDARDS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [docs, setDocs] = useState<AccreditationDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role] = useState(localStorage.getItem('userRole'));

  const [formData, setFormData] = useState({
    title: '',
    file_url: ''
  });

  useEffect(() => {
    if (selectedStandard) {
      fetchDocs();
    }
  }, [selectedStandard]);

  const fetchDocs = async () => {
    if (!selectedStandard) return;
    const { data } = await supabase
      .from('akreditasi_docs')
      .select('*')
      .eq('standard_id', selectedStandard.id)
      .order('created_at', { ascending: false });
    if (data) setDocs(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStandard) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('akreditasi_docs').insert([{
        title: formData.title,
        file_url: formData.file_url,
        standard_id: selectedStandard.id,
        uploader: localStorage.getItem('userEmail') || 'System'
      }]);
      if (error) throw error;
      toast.success('Dokumen Akreditasi tersimpan!');
      setFormData({ title: '', file_url: '' });
      setIsModalOpen(false);
      fetchDocs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dokumen ini?')) return;
    const { error } = await supabase.from('akreditasi_docs').delete().eq('id', id);
    if (!error) {
      toast.success('Dihapus');
      fetchDocs();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-sidebar uppercase italic tracking-tighter flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-sidebar">
              <ShieldCheck className="w-7 h-7" />
            </div>
            Akreditasi <span className="text-brand-accent">SNP</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.15em] ml-16">Sistem Penjaminan Mutu & Manajemen Dokumen Dasar</p>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Cari Dokumen Akreditasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-6 text-xs font-bold focus:border-brand-accent outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Main Layout */}
      {!selectedStandard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STANDARDS.map((std, idx) => (
            <motion.button
              key={std.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedStandard(std)}
              className="bg-white group p-6 rounded-[2rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-brand-accent/20 transition-all text-left relative overflow-hidden active:scale-95"
            >
              <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FolderLock className="w-32 h-32 rotate-12" />
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-accent group-hover:bg-brand-accent/10 transition-all mb-4">
                <FolderOpen className="w-5 h-5" />
              </div>
              <span className="inline-block text-[8px] font-black text-brand-accent uppercase tracking-[0.2em] mb-2 px-2 py-0.5 bg-brand-accent/5 rounded-md">Standard {std.id}</span>
              <h3 className="text-xs font-black text-brand-sidebar uppercase italic tracking-tight mb-2 group-hover:text-brand-accent">{std.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed mb-4 line-clamp-2">{std.desc}</p>
              <div className="flex items-center gap-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                Klik untuk akses berkas
                <ChevronRight className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Breadcrumb / Back Navigation */}
          <div className="flex items-center justify-between border-b pb-6">
            <button 
              onClick={() => setSelectedStandard(null)}
              className="flex items-center gap-3 text-slate-400 hover:text-brand-sidebar transition-colors"
            >
              <div className="p-2 bg-slate-100 rounded-lg">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Kembali ke Folder Utama</span>
                <span className="text-xs font-black uppercase italic tracking-tight text-slate-700">{selectedStandard.name}</span>
              </div>
            </button>

            {(role === 'Admin' || role === 'SuperAdmin') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-sidebar text-white py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-brand-sidebar/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Berkas
              </button>
            )}
          </div>

          {/* Docs List */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                docs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
                  <div key={doc.id} className="group bg-slate-50/50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:border-brand-accent/20 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center text-brand-sidebar">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-emerald-500 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {(role === 'Admin' || role === 'SuperAdmin') && (
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-700 leading-tight mb-2 line-clamp-2">{doc.title}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(doc.created_at).toLocaleDateString()}</span>
                      <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest italic">{doc.uploader.split('@')[0]}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Folder ini masih kosong</h4>
                  <p className="text-[9px] font-bold text-slate-300 mt-1">Belum ada dokumen standar yang diunggah untuk kategori ini.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

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
                Upload <span className="text-brand-accent">Dokumen Bukti</span>
              </h2>

              <p className="text-[10px] font-black text-slate-400 bg-slate-50 p-4 rounded-xl mb-6 leading-relaxed">
                <span className="text-brand-accent">Standard:</span> {selectedStandard?.name}
              </p>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama / Judul Dokumen</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: SK Pengurus 2024"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link File (Cloud/Drive/URL)</label>
                  <input 
                    type="url" 
                    required
                    value={formData.file_url}
                    onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                    placeholder="Gunakan URL publik dari Storage atau G-Drive"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Security Guarantee</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">Berkas ini disimpan secara aman dan hanya dapat diakses oleh Admin berwenang untuk kebutuhan Akreditasi BAN PNF.</p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:bg-brand-accent active:scale-95 transition-all mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan ke Folder SNP
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
