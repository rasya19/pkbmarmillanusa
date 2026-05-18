import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  LayoutGrid, 
  List, 
  ChevronRight,
  FileText,
  Plus,
  FileUp,
  FileDown,
  Download,
  X,
  Check,
  Loader2,
  Trash2,
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Modul {
  id: string;
  title: string;
  subject: string;
  tutor: string;
  modules: number;
  category: string;
  program: string;
  pdfUrl?: string;
  color?: string;
}

export default function Materi() {
  const [materiList, setMateriList] = useState<Modul[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModul, setEditingModul] = useState<Modul | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('Semua Program');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userRole = localStorage.getItem('userRole');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    tutor: '',
    modules: 0,
    category: 'Akademik',
    program: 'Paket C',
    pdfUrl: ''
  });

  const categories = ['Akademik', 'Vokasi', 'Keterampilan', 'Umum'];
  const programs = ['Paket A', 'Paket B', 'Paket C', 'Keterampilan'];

  useEffect(() => {
    fetchMateri();
  }, []);

  const fetchMateri = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('materi_ajar').select('*').order('created_at', { ascending: false });
      
      if (error) {
        console.error('DEBUG [Materi] Fetch error:', error.message);
        // Fallback for missing table or permissions
        if (error.code === 'PGRST116' || error.message.includes('find') || error.message.includes('exist')) {
           console.log('DEBUG [Materi] Table not found or inaccessible, showing empty state.');
           setMateriList([]);
           return;
        }
      }

      if (data && data.length > 0) {
        setMateriList(data.map(item => ({
          id: item.id,
          title: item.judul || item.title || '',
          subject: item.mata_pelajaran || item.subject || '',
          tutor: item.pengampu || item.tutor || '',
          modules: item.total_modul || item.modules || 0,
          category: item.kategori || item.category || 'Akademik',
          program: item.program || '',
          pdfUrl: item.pdf_url || item.pdfUrl || '#',
          color: item.warna || 'bg-brand-sidebar'
        })));
      } else {
        // Fallback for first load
        setMateriList([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (modul?: Modul) => {
    if (modul) {
      setEditingModul(modul);
      setFormData({
        title: modul.title,
        subject: modul.subject,
        tutor: modul.tutor,
        modules: modul.modules,
        category: modul.category,
        program: modul.program,
        pdfUrl: modul.pdfUrl || ''
      });
    } else {
      setEditingModul(null);
      setFormData({
        title: '',
        subject: '',
        tutor: '',
        modules: 0,
        category: 'Akademik',
        program: 'Paket C',
        pdfUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload: any = {
        judul: formData.title,
        mata_pelajaran: formData.subject,
        pengampu: formData.tutor,
        total_modul: formData.modules,
        kategori: formData.category,
        program: formData.program,
        pdf_url: formData.pdfUrl
      };

      const performSave = async (data: any) => {
        if (editingModul && editingModul.id) {
          const { error } = await supabase.from('materi_ajar').update(data).eq('id', editingModul.id);
          if (error) {
            if (error.message.includes('mata_pelajaran') || error.message.includes('pdf_url')) {
              const cleaned = { ...data };
              delete cleaned.mata_pelajaran;
              delete cleaned.pdf_url;
              const { error: retryError } = await supabase.from('materi_ajar').update(cleaned).eq('id', editingModul.id);
              if (retryError) throw retryError;
            } else throw error;
          }
        } else {
          const { error } = await supabase.from('materi_ajar').insert([data]);
          if (error) {
            if (error.message.includes('mata_pelajaran') || error.message.includes('pdf_url')) {
              const cleaned = { ...data };
              delete cleaned.mata_pelajaran;
              delete cleaned.pdf_url;
              const { error: retryError } = await supabase.from('materi_ajar').insert([cleaned]);
              if (retryError) throw retryError;
            } else throw error;
          }
        }
      };

      await performSave(payload);
      
      await fetchMateri();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Gagal menyimpan data materi: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      try {
        const { error } = await supabase.from('materi_ajar').delete().eq('id', id);
        if (error) throw error;
        await fetchMateri();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus materi.');
      }
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedMateri = data.map(item => ({
        judul: item.Judul || item.title || '',
        mata_pelajaran: item["Mata Pelajaran"] || item.subject || '',
        pengampu: item.Pengampu || item.tutor || '',
        total_modul: parseInt(item.Modules || item.modules || '0'),
        kategori: item.Kategori || item.category || 'Akademik',
        program: item.Program || item.program || '',
        pdf_url: item["PDF Link"] || item.pdf_url || '#'
      }));

      try {
        const { error } = await supabase.from('materi_ajar').insert(importedMateri);
        if (error) throw error;
        alert(`${importedMateri.length} materi berhasil diimport.`);
      } catch (err: any) {
        console.error(err);
        alert('Gagal mengimport materi: ' + err.message);
      }
      
      await fetchMateri();
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const data = [
      ["Judul", "Mata Pelajaran", "Pengampu", "Modules", "Kategori", "Program", "PDF Link"],
      ["Bahasa Indonesia - Paket C", "Bahasa Indonesia", "Dra. Siti Aminah", "12", "Akademik", "Paket C", "#"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Materi");
    XLSX.writeFile(wb, "template_import_materi.xlsx");
  };

  const filteredMateri = materiList.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.tutor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = filterProgram === 'Semua Program' || m.program === filterProgram;
    return matchesSearch && matchesProgram;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main italic">MATERI AJAR <span className="not-italic text-brand-accent">(E-MODUL)</span></h2>
          <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-[0.2em]">PKBM Armilla Nusa Digital Library</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(userRole === 'Admin' || userRole === 'Guru') && (
            <>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-brand-bg border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all italic"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <FileUp className="w-3.5 h-3.5" />
                Import
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:shadow-lg shadow-brand-accent/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Materi
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-1">
        <div className="flex-1 bg-white border border-brand-border rounded-xl flex items-center px-4 py-2 gap-3 group focus-within:border-brand-accent transition-all shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari materi atau pengampu..." 
            className="bg-transparent border-none outline-none text-xs w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-brand-border rounded-xl px-4 py-2 text-xs font-bold text-brand-text-main outline-none focus:border-brand-accent transition-all shadow-sm cursor-pointer"
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
        >
          <option>Semua Program</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
           <Loader2 className="w-8 h-8 animate-spin text-brand-accent mb-4" />
           <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Menghubungkan ke Bank Materi...</p>
        </div>
      ) : filteredMateri.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-3xl p-20 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-slate-200" />
           </div>
           <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest mb-2">Materi Tidak Ditemukan</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase">Maaf, kami tidak dapat menemukan modul yang Anda cari di database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMateri.map((m) => (
            <motion.div 
              layout
              key={m.id} 
              className="bg-white rounded-[2rem] border border-brand-border overflow-hidden group hover:border-brand-accent transition-all flex flex-col p-6 shadow-sm relative"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {(userRole === 'Admin' || userRole === 'Guru') && (
                  <>
                    <button 
                      onClick={() => handleOpenModal(m)}
                      className="p-1.5 bg-white border border-brand-border rounded-lg text-slate-400 hover:text-brand-accent shadow-sm"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 bg-white border border-brand-border rounded-lg text-slate-400 hover:text-red-500 shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              <div className={`w-12 h-12 ${m.color || 'bg-brand-sidebar'} rounded-2xl mb-5 flex items-center justify-center text-white shadow-xl shadow-brand-sidebar/10 group-hover:scale-110 transition-transform`}>
                <FileText className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className="text-[8px] font-black text-brand-accent bg-brand-accent/5 px-2 py-1 rounded-lg uppercase tracking-wider">{m.category}</span>
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider font-mono">{m.program}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter">{m.modules} Modul</span>
                </div>
                <h4 className="font-black text-base text-brand-text-main leading-snug mb-1 group-hover:text-brand-accent transition-colors uppercase italic">{m.title}</h4>
                <p className="text-[9px] font-bold text-brand-accent uppercase tracking-widest mb-3">{m.subject}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                    {m.tutor.split(' ').filter(n => n.length > 2).map(n => n[0]).join('').slice(0,2).toUpperCase() || 'TR'}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Guru: <span className="text-brand-sidebar italic">{m.tutor}</span></p>
                </div>
              </div>

              <div className="mt-4 pt-5 border-t border-brand-border flex justify-between items-center">
                <a 
                  href={m.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] font-black text-brand-accent hover:underline flex items-center gap-1.5 uppercase tracking-[0.2em] italic"
                >
                  Buka Materi <Download className="w-3 h-3" />
                </a>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 border border-white flex items-center justify-center text-[8px] text-slate-400 font-black">+14</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Materi */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-sidebar/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-brand-border"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black text-brand-sidebar uppercase italic tracking-widest">
                      KELOLA <span className="text-brand-accent">MODUL MATERI</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Lengkapi informasi materi ajar</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-slate-50 rounded-2xl transition-colors">
                    <X className="w-5 h-5 text-slate-300" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-5 shadow-inner">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1 italic">Judul Modul</label>
                    <input 
                      type="text" required
                      placeholder="Contoh: Modul 1 Bahasa Indonesia"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1 italic">Mata Pelajaran</label>
                      <input 
                        type="text" required
                        placeholder="Mata Pelajaran"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1 italic">Guru Pengampu</label>
                      <input 
                        type="text" required
                        placeholder="Nama Guru"
                        value={formData.tutor}
                        onChange={(e) => setFormData({...formData, tutor: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1 italic">Link File PDF (Placeholder)</label>
                    <input 
                      type="text"
                      placeholder="https://example.com/modul.pdf"
                      value={formData.pdfUrl}
                      onChange={(e) => setFormData({...formData, pdfUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Kategori</label>
                      <select 
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all cursor-pointer"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Program</label>
                      <select 
                        required
                        value={formData.program}
                        onChange={(e) => setFormData({...formData, program: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all cursor-pointer"
                      >
                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Total Modul</label>
                    <input 
                      type="number" required
                      value={formData.modules}
                      onChange={(e) => setFormData({...formData, modules: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1 px-6 py-4 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 italic" 
                      disabled={isSaving}
                    >
                      Tutup
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className="flex-[2] px-6 py-4 bg-brand-sidebar text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand-sidebar/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 italic"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} 
                      {isSaving ? 'Memproses...' : 'Simpan Materi'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
