import React, { useState, useEffect } from 'react';
import { Layers, Users, Plus, GraduationCap, X, Check, Trash2, ArrowRight, TrendingUp, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ClassData {
  id: string;
  nama_kelas: string;
  tingkat: string;
  wali_kelas_id: string;
  school_id: string;
}

export default function Kelas() {
  const { school } = useSchool();
  const [activeTab, setActiveTab] = useState<'daftar' | 'kenaikan'>('daftar');
  
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [guruList, setGuruList] = useState<{ id: string; nama: string }[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!school) return;
    fetchKelasList();
    fetchGuruList();
    fetchStudentCounts();
  }, [school]);

  const fetchKelasList = async () => {
    if (!school) return;
    try {
      const { data, error } = await supabase.from('kelas').select('*').eq('school_id', school.slug).order('nama_kelas', { ascending: true });
      if (data) {
        setClasses(data.map((d: any) => ({
          id: d.id,
          nama_kelas: d.nama_kelas,
          tingkat: d.tingkat || '',
          wali_kelas_id: d.wali_kelas_id || '',
          school_id: d.school_id
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGuruList = async () => {
    try {
      const { data, error } = await supabase.from('profiles_guru').select('id, nama').order('nama', { ascending: true });
      if (data) setGuruList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentCounts = async () => {
    try {
      const { data, error } = await supabase.from('profiles_siswa').select('class');
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((s: any) => {
          if (s.class) counts[s.class] = (counts[s.class] || 0) + 1;
        });
        setStudentCounts(counts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWali = async (classId: string, w: string) => {
    try {
      setClasses(classes.map(c => c.id === classId ? { ...c, wali_kelas_id: w } : c));
      await supabase.from('kelas').update({ wali_kelas_id: w ? w : null }).eq('id', classId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateName = async (classId: string, name: string) => {
    try {
      setClasses(classes.map(c => c.id === classId ? { ...c, name } : c));
      await supabase.from('kelas').update({ nama_kelas: name }).eq('id', classId);
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleUpdateTingkat = async (classId: string, tingkat: string) => {
    try {
      setClasses(classes.map(c => c.id === classId ? { ...c, tingkat } : c));
      await supabase.from('kelas').update({ tingkat }).eq('id', classId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (window.confirm('Hapus kelas ini?')) {
      try {
        setClasses(classes.filter(c => c.id !== id));
        await supabase.from('kelas').delete().eq('id', id);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama_kelas: '', tingkat: '', wali_kelas_id: '' });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        nama_kelas: formData.nama_kelas,
        tingkat: formData.tingkat,
        school_id: school.slug
      };
      if (formData.wali_kelas_id) {
         payload.wali_kelas_id = formData.wali_kelas_id;
      }
      const { data, error } = await supabase.from('kelas').insert([payload]).select();
      if (error) throw error;
      if (data) {
        const newClass = data[0];
        setClasses([...classes, {
          id: newClass.id,
          nama_kelas: newClass.nama_kelas,
          tingkat: newClass.tingkat || '',
          wali_kelas_id: newClass.wali_kelas_id || '',
          school_id: newClass.school_id || ''
        }]);
      }
      setIsModalOpen(false);
      setFormData({ nama_kelas: '', tingkat: '', wali_kelas_id: '' });
    } catch (error: any) {
      console.error(error);
      alert('Gagal menambah kelas: ' + error.message);
    }
  };

  // Kenaikan Kelas State
  const [promoFrom, setPromoFrom] = useState('');
  const [promoTo, setPromoTo] = useState('');
  const [promoCount, setPromoCount] = useState(0);

  useEffect(() => {
    if (promoFrom) {
       const cls = classes.find(c => c.id === promoFrom);
       setPromoCount(cls ? (studentCounts[cls.nama_kelas] || 0) : 0);
    } else {
       setPromoCount(0);
    }
  }, [promoFrom, studentCounts, classes]);

  const handleProcessPromo = async () => {
    if (!promoFrom || !promoTo) {
      alert("Pilih kelas asal dan tujuan!");
      return;
    }
    if (promoCount === 0) {
      alert("Tidak ada siswa di kelas asal!");
      return;
    }
    
    const clsAsalLabel = classes.find(c => c.id === promoFrom)?.nama_kelas || promoFrom;
    const clsTujuanLabel = promoTo === 'Lulus' ? 'Lulus' : (classes.find(c => c.id === promoTo)?.nama_kelas || promoTo);

    let message = `Apakah Anda yakin ingin menaikkan ${promoCount} siswa dari ${clsAsalLabel} ke ${clsTujuanLabel}?`;
    if (promoTo === 'Lulus') {
       message = `Apakah Anda yakin ingin MELULUSKAN ${promoCount} siswa dari ${clsAsalLabel}? Data akan diubah statusnya menjadi Lulus.`;
    }

    if (window.confirm(message)) {
       setIsLoading(true);
       try {
         if (promoTo === 'Lulus') {
            const clsAsal = classes.find(c => c.id === promoFrom);
            if (!clsAsal) throw new Error("Kelas asal tidak ditemukan");
            const { error } = await supabase
             .from('profiles_siswa')
             .update({ status: 'Lulus' })
             .eq('class', clsAsal.nama_kelas);
             if (error) throw error;
         } else {
             const { error } = await supabase.rpc('naikkan_kelas_massal', { id_asal: promoFrom, id_tujuan: promoTo });
             if (error) throw error;
         }
         
         alert('Proses berhasil diproses!');
         fetchStudentCounts();
         setPromoFrom('');
         setPromoTo('');
       } catch (err: any) {
         console.error(err);
         alert("Gagal memproses: " + err.message);
       } finally {
         setIsLoading(false);
       }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main tracking-tight uppercase">Manajemen <span className="text-brand-accent italic">Kelas</span></h2>
          <p className="text-[10px] text-brand-text-muted font-bold tracking-widest uppercase italic">Total {classes.length} Rombongan Belajar</p>
        </div>
        {activeTab === 'daftar' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-accent/20 hover:scale-105 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kelas
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-brand-border">
         <button 
           onClick={() => setActiveTab('daftar')}
           className={cn(
             "px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all",
             activeTab === 'daftar' ? "border-brand-accent text-brand-accent" : "border-transparent text-slate-400 hover:text-slate-600"
           )}
         >
           Daftar Kelas
         </button>
         <button 
           onClick={() => setActiveTab('kenaikan')}
           className={cn(
             "px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all",
             activeTab === 'kenaikan' ? "border-brand-accent text-brand-accent" : "border-transparent text-slate-400 hover:text-slate-600"
           )}
         >
           Kenaikan Kelas
         </button>
      </div>

      {activeTab === 'daftar' && (
        <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-brand-border">
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Kelas</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tingkat</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wali Kelas</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jml. Siswa</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-brand-border">
                 {classes.length > 0 ? classes.map(c => (
                   <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                         <input 
                           type="text"
                           value={c.nama_kelas}
                           onChange={(e) => handleUpdateName(c.id, e.target.value)}
                           className="bg-transparent border border-transparent hover:border-brand-border focus:border-brand-accent focus:bg-white rounded-lg px-3 py-2 text-xs font-bold text-brand-sidebar outline-none transition-all w-full uppercase"
                         />
                      </td>
                      <td className="px-6 py-4 text-center">
                         <input 
                           type="text"
                           value={c.tingkat}
                           onChange={(e) => handleUpdateTingkat(c.id, e.target.value)}
                           className="bg-transparent border border-transparent hover:border-brand-border focus:border-brand-accent focus:bg-white rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none transition-all w-20 text-center uppercase"
                           placeholder="-"
                         />
                      </td>
                      <td className="px-6 py-4">
                         <select 
                           value={c.wali_kelas_id}
                           onChange={(e) => handleUpdateWali(c.id, e.target.value)}
                           className="w-full bg-slate-50 border border-brand-border rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-accent cursor-pointer"
                         >
                           <option value="">-- Pilih Wali Kelas --</option>
                           {guruList.map(g => (
                             <option key={g.id} value={g.id}>{g.nama}</option>
                           ))}
                         </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 rounded-lg px-3 py-1 text-xs font-bold">
                           <Users className="w-3.5 h-3.5" />
                           {studentCounts[c.nama_kelas] || 0}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleDeleteClass(c.id)}
                           className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                       Belum ada kelas
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'kenaikan' && (
        <div className="bg-white border border-brand-border rounded-3xl p-8 shadow-sm max-w-3xl">
           <div className="mb-8">
              <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-brand-accent" />
                 Proses Kenaikan Kelas
              </h3>
              <p className="text-xs text-slate-500 mt-2">Pindahkan semua siswa dari satu kelas ke kelas tujuan pada pergantian tahun ajaran baru.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dari Kelas (Asal)</label>
                 <select 
                   value={promoFrom}
                   onChange={(e) => setPromoFrom(e.target.value)}
                   className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent cursor-pointer"
                 >
                   <option value="">-- Pilih Kelas Asal --</option>
                   {classes.map(c => (
                     <option key={c.id} value={c.id}>{c.nama_kelas}</option>
                   ))}
                 </select>
                 <div className="text-[10px] font-black text-emerald-600 mt-2">Jumlah Siswa: {promoCount}</div>
              </div>

              <div className="flex justify-center hidden md:flex">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                   <ArrowRight className="w-5 h-5 text-emerald-500" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ke Kelas (Tujuan)</label>
                 <select 
                   value={promoTo}
                   onChange={(e) => setPromoTo(e.target.value)}
                   className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent cursor-pointer"
                 >
                   <option value="">-- Pilih Kelas Tujuan --</option>
                   {classes.map(c => (
                     <option key={`to-${c.id}`} value={c.id}>{c.nama_kelas}</option>
                   ))}
                   <option value="Lulus" className="text-blue-600 font-black">LULUS / ALUMNI</option>
                 </select>
              </div>
           </div>

           <div className="mt-10 pt-8 border-t border-brand-border flex justify-end">
              <button 
                onClick={handleProcessPromo}
                disabled={isLoading || !promoFrom || !promoTo || promoCount === 0}
                className="bg-brand-sidebar text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest italic flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-brand-sidebar/20"
              >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4 text-brand-accent" />}
                 Proses Kenaikan Kelas
              </button>
           </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-brand-border p-8"
            >
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-brand-sidebar uppercase italic tracking-widest">
                   TAMBAH <span className="text-brand-accent">KELAS</span>
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
               </div>

               <form onSubmit={handleAddClass} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Kelas / Rombel</label>
                   <input 
                     type="text" required
                     value={formData.nama_kelas}
                     onChange={e => setFormData({...formData, nama_kelas: e.target.value})}
                     className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-brand-accent"
                     placeholder="Contoh: 10 IPA 1"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat</label>
                   <input 
                     type="text" required
                     value={formData.tingkat}
                     onChange={e => setFormData({...formData, tingkat: e.target.value})}
                     className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-brand-accent"
                     placeholder="Contoh: 10"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wali Kelas</label>
                   <select 
                     value={formData.wali_kelas_id}
                     onChange={(e) => setFormData({...formData, wali_kelas_id: e.target.value})}
                     className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:border-brand-accent outline-none"
                   >
                     <option value="">-- Pilih Wali Kelas --</option>
                     {guruList.map(guru => (
                       <option key={guru.id} value={guru.id}>{guru.nama}</option>
                     ))}
                   </select>
                 </div>
                 <button type="submit" className="w-full bg-brand-accent text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4">
                   Simpan Kelas
                 </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
