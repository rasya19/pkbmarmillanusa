import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit2, Trash2, 
  User, MapPin, GraduationCap, Upload, X, ShieldCheck, 
  Phone, CheckCircle2, AlertCircle, Loader2, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export interface Student {
  id: string;
  nisn: string;
  nama: string;
  class: string;
  whatsapp: string;
  status: 'Aktif' | 'Nonaktif' | 'Lulus' | 'Pindah';
  photourl?: string;
  school_id: string;
}

export default function DataSiswa() {
  const { school, loading: schoolLoading } = useSchool();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    const fetchClasses = async () => {
      if (schoolLoading || !school) return;
      const { data } = await supabase.from('kelas').select('id, nama_kelas').eq('school_id', school.npsn).order('nama_kelas', { ascending: true });
      if (data) {
        setClasses(data.map(d => ({ id: d.id, name: d.nama_kelas })));
      }
    };
    fetchClasses();
  }, [school, schoolLoading]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Student>>({
    nisn: '',
    nama: '',
    class: '',
    whatsapp: '',
    status: 'Aktif',
    photourl: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [school, schoolLoading]);

  const fetchStudents = async () => {
     if (schoolLoading) return;
     if (!school) {
       setIsLoading(false);
       return;
     }

    try {
      setIsLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('profiles_siswa')
        .select('*')
        .eq('school_id', school.npsn)
        .order('nama', { ascending: true });

      if (error) {
        setFetchError(`Supabase Error: ${error.message} (Code: ${error.code})`);
        console.error('Error fetching students:', error);
        setIsLoading(false);
        return;
      }

      setStudents(data as Student[] || []);
    } catch (err: any) {
      setFetchError(`Runtime Error: ${err.message || JSON.stringify(err)}`);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.nisn?.includes(searchTerm)
  );

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setFormData(student);
      setIsEditing(true);
    } else {
      setFormData({ nisn: '', nama: '', class: '', whatsapp: '', status: 'Aktif', photourl: '' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      try {
        const { error } = await supabase
          .from('profiles_siswa')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setStudents(students.filter(s => s.id !== id));
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Gagal menghapus data siswa');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setIsSaving(true);
    try {
      if (isEditing && formData.id) {
        const { error } = await supabase
          .from('profiles_siswa')
          .update({
            nisn: formData.nisn || null,
            nama: formData.nama,
            class: formData.class,
            whatsapp: formData.whatsapp,
            status: formData.status,
            photourl: formData.photourl,
            school_id: school.npsn
          })
          .eq('id', formData.id);

        if (error) throw error;
        setStudents(students.map(s => s.id === formData.id ? { ...s, ...formData } as Student : s));
      } else {
        const { data, error } = await supabase
          .from('profiles_siswa')
          .insert([{
            nisn: formData.nisn || null,
            nama: formData.nama,
            class: formData.class,
            whatsapp: formData.whatsapp,
            status: formData.status,
            photourl: formData.photourl,
            school_id: school.npsn
          }])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setStudents([...students, data[0] as Student]);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving student:', err);
      let errMsg = err.message || 'Unknown error';
      if (errMsg.includes('unique constraint') && errMsg.includes('nisn')) {
        errMsg = 'NISN sudah terdaftar untuk siswa lain. Silakan gunakan NISN yang berbeda.';
      } else if (errMsg.includes('uuid')) {
        errMsg = 'Terdapat data ID/Kelas yang tidak valid.';
      }
      alert('Gagal menyimpan data siswa: ' + errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: Student['status']) => {
    switch(status) {
      case 'Aktif': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Lulus': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Pindah': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Nonaktif': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const toInsert = data.map(item => ({
          nisn: String(item.NISN || item.nisn || '') || null,
          nama: item.Nama || item.nama || item.name || '',
          class: String(item.Kelas || item.class || item.kelas || ''),
          whatsapp: String(item.WhatsApp || item.whatsapp || item.noHp || ''),
          status: item.Status || item.status || 'Aktif',
          photourl: item.photourl || '',
          school_id: school.npsn
        })).filter(s => s.nama);

        if (toInsert.length > 0) {
          const { error } = await supabase.from('profiles_siswa').insert(toInsert);
          if (error) throw error;
          alert(`Berhasil mengimpor ${toInsert.length} data siswa.`);
          fetchStudents();
        } else {
          alert('Tidak ada data valid yang bisa diimpor.');
        }
      } catch (err: any) {
        console.error(err);
        alert('Gagal mengimpor data: ' + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        className="hidden" 
        accept=".xlsx, .xls"
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden group shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Master Data <span className="text-emerald-400 italic">Siswa</span></h1>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest pl-1">Kelola Identitas dan Profil Siswa</p>
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600/30 transition-all shadow-lg disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
            {isImporting ? 'Mengimpor...' : 'Import Data'}
          </button>
          <button 
            onClick={() => setIsPrinting(true)}
            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600/30 transition-all shadow-lg"
          >
            Cetak Kartu Ujian
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan Nama Lengkap atau NISN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="bg-slate-50 text-slate-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-800 transition-all flex items-center gap-2 border border-slate-200">
               <Filter className="w-3 h-3" /> Filter Kelas
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20">Foto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NISN</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Lengkap</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelas / Rombel</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Memuat data siswa...
                   </td>
                </tr>
              ) : fetchError ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-red-500 text-xs font-medium bg-red-50/50">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-75" />
                      {fetchError}
                   </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs font-medium">
                      Tidak ada data siswa yang ditemukan.
                   </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                       {student.photourl ? (
                         <img src={student.photourl} alt={student.nama} className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-5 h-5 text-slate-400" />
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 font-mono tracking-wider">{student.nisn}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-800 tracking-tight">{student.nama}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                      {student.class}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {student.whatsapp || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border", getStatusColor(student.status))}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={async () => {
                          if(window.confirm('Reset Password / Sesi login siswa ini? (Mengizinkan login ulang jika akun nyangkut)')) {
                            try {
                              await supabase.from('profiles_siswa').update({ is_online: false }).eq('id', student.id);
                              fetchStudents();
                              toast.success('Password/Sesi berhasil direset. Siswa dapat login kembali.');
                            } catch (e: any) {
                              toast.error('Gagal mereset: ' + e.message);
                            }
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip tooltip-left"
                        data-tip="Reset Password / Sesi"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(student)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip tooltip-left"
                        data-tip="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip tooltip-left"
                        data-tip="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isPrinting && (
          <div className="fixed inset-0 bg-slate-100 z-[200] overflow-y-auto">
            <div className="p-6 pb-20 print:p-0">
              <div className="max-w-4xl mx-auto flex gap-4 mb-8 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                >
                  Confirm & Cetak PDF
                </button>
                <button 
                  onClick={() => setIsPrinting(false)} 
                  className="bg-white border border-slate-200 text-slate-800 px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Tutup / Batal
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mx-auto max-w-4xl print:grid-cols-2 lg:print:grid-cols-3 print:gap-4 print:max-w-none">
                {filteredStudents.map(student => (
                  <div key={student.id} className="bg-white border-2 border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center break-inside-avoid shadow-[6px_6px_0px_#1e293b] print:shadow-none print:border-slate-400">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">KARTU PESERTA UJIAN</h4>
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 mb-4">PKBM Armilla Nusa</h3>
                    
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden mb-4 shadow-sm">
                       {student.photourl ? (
                         <img src={student.photourl} alt={student.nama} className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-8 h-8 text-slate-300" />
                       )}
                    </div>

                    <div className="w-full space-y-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Nama Siswa</p>
                        <p className="text-sm font-black text-slate-800 uppercase leading-snug">{student.nama}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">NISN / Username</p>
                        <p className="text-sm font-black text-slate-800 font-mono tracking-widest">{student.nisn}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Password</p>
                        <p className="text-sm font-black text-slate-800 font-mono tracking-widest">{student.nisn}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 p-6 flex flex-col relative shrink-0">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                 <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-500/20 rounded-xl">
                          <User className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div>
                          <h3 className="font-black text-white uppercase tracking-widest text-lg leading-tight">
                             {isEditing ? 'Edit Data' : 'Tambah'} <span className="text-emerald-400 italic">Siswa</span>
                          </h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Lengkapi formulir di bawah ini</p>
                       </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors relative z-10 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                 <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo Area */}
                    <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-100">
                       <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                          {formData.photourl ? (
                             <img src={formData.photourl} alt="Preview" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                          ) : (
                             <User className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Upload className="w-5 h-5 text-white" />
                          </div>
                       </div>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest cursor-pointer hover:underline">Unggah Foto Siswa</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NISN</label>
                         <input 
                           type="text" 
                           required
                           value={formData.nisn}
                           onChange={e => setFormData({...formData, nisn: e.target.value})}
                           placeholder="Contoh: 0012345678"
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                         <input 
                           type="text" 
                           required
                           value={formData.nama}
                           onChange={e => setFormData({...formData, nama: e.target.value})}
                           placeholder="Contoh: Ahmad Rafli"
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                         />
                       </div>
                       <div className="space-y-2 lg:col-span-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><GraduationCap className="w-3 h-3" /> Kelas / Rombel</label>
                         <select 
                           required
                           value={formData.class}
                           onChange={e => setFormData({...formData, class: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all uppercase"
                         >
                           <option value="">-- Pilih Kelas --</option>
                           {classes.map(c => (
                             <option key={c.id} value={c.name}>{c.name}</option>
                           ))}
                         </select>
                       </div>
                       <div className="space-y-2 lg:col-span-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> WhatsApp Aktif</label>
                         <input 
                           type="text" 
                           required
                           value={formData.whatsapp}
                           onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                           placeholder="Contoh: 0812..."
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                         />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">Status Siswa</label>
                         <select 
                           required
                           value={formData.status}
                           onChange={e => setFormData({...formData, status: e.target.value as Student['status']})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                         >
                            <option value="Aktif">Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                            <option value="Lulus">Lulus</option>
                            <option value="Pindah">Pindah</option>
                         </select>
                       </div>
                    </div>
                 </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                 <button 
                   type="button"
                   disabled={isSaving}
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 bg-white text-slate-600 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Batal
                 </button>
                 <button 
                   form="student-form"
                   type="submit"
                   disabled={isSaving}
                   className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSaving ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : (
                     <ShieldCheck className="w-4 h-4" />
                   )}
                   {isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Data')}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
