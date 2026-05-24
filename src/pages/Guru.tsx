import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, MoreVertical, Plus, Download, X, Check, FileUp, FileDown, Edit2, Trash2, Sparkles, Loader2, CloudUpload, ShieldAlert, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  nip: string;
  email?: string;
  phone?: string;
  alamat?: string;
  password?: string;
  must_change_password?: boolean;
  school_id: string;
}

export default function Guru() {
  const { school } = useSchool();
  const [guruList, setGuruList] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const [mapels] = useState<any[]>(() => {
    const saved = localStorage.getItem('school_mapel_list');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserEmail(user.email || null);
      } else {
        // Fallback for static login
        const staticEmail = localStorage.getItem('teacherEmail') || (userRole === 'Guru' ? 'guru@pkbmarmillanusa.com' : null);
        setCurrentUserEmail(staticEmail);
      }
    };
    getUser();
    if (school) fetchGuru();
  }, [userRole, school]);

  const fetchGuru = async () => {
    if (!school) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('profiles_guru').select('*').eq('school_id', school.npsn).order('created_at', { ascending: false });
      
      if (error && !error.message.includes('Could not find the table')) {
        console.error('Error fetching guru:', error);
        toast.error('Gagal mengambil data guru: ' + error.message);
        return;
      }

      if (data && data.length > 0) {
        const formattedData: Teacher[] = data.map(item => ({
          id: item.id,
          name: item.nama || item.name || '',
          nip: item.nip || '',
          email: item.email || '',
          phone: item.phone || item.whatsapp || '',
          alamat: item.alamat || '',
          password: item.password || '',
          must_change_password: item.must_change_password || false,
          school_id: item.school_id
        }));
        setGuruList(formattedData);

        // Check if current user needs to change password
        if (userRole === 'Guru' && currentUserEmail) {
          const me = formattedData.find(g => g.email === currentUserEmail);
          if (me && me.must_change_password) {
            setShowForcePasswordChange(true);
            handleOpenModal(me);
          }
        }
      } else {
        setGuruList([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Teacher | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nip: '',
    email: '',
    phone: '',
    alamat: '',
    password: ''
  });

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingGuru(teacher);
      setFormData({
        name: teacher.name,
        nip: teacher.nip,
        email: teacher.email || '',
        phone: teacher.phone || '',
        alamat: teacher.alamat || '',
        password: teacher.password || ''
      });
    } else {
      setEditingGuru(null);
      setFormData({
        name: '',
        nip: '',
        email: '',
        phone: '',
        alamat: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleResetPassword = async (teacher: Teacher) => {
    if (!window.confirm(`Reset password ${teacher.name} ke default "12345678"?`)) return;
    
    try {
      const payload: any = { password: '12345678' };
      // Try to include must_change_password if supported by DB
      payload.must_change_password = true;

      const { error } = await supabase
        .from('profiles_guru')
        .update(payload)
        .eq('id', teacher.id);

      if (error) {
        // If column missing, try without it
        if (error.message.includes("must_change_password")) {
          delete payload.must_change_password;
          const { error: retryError } = await supabase
            .from('profiles_guru')
            .update(payload)
            .eq('id', teacher.id);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      
      toast.success('Password berhasil direset ke 12345678');
      fetchGuru();
    } catch (error: any) {
      toast.error('Gagal reset password: ' + error.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setIsSaving(true);
    
    try {
      const payload: any = {
        nama: formData.name,
        nip: formData.nip,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.phone, // Send both just in case
        alamat: formData.alamat,
        password: formData.password,
        school_id: school.npsn
      };

      // If Guru edits their own profile, clear the force change flag
      if (userRole === 'Guru' && showForcePasswordChange) {
        payload.must_change_password = false;
      }

      const performSave = async (data: any) => {
        if (editingGuru && editingGuru.id && !editingGuru.id.startsWith('temp')) {
          const { data: result, error } = await supabase.from('profiles_guru').update(data).eq('id', editingGuru.id).select();
          if (error) {
            // Graceful degradation if column missing
            let cleanedData = { ...data };
            let retryNeeded = false;
            
            if (error.message.includes("must_change_password")) {
              delete cleanedData.must_change_password;
              retryNeeded = true;
            }
            if (error.message.includes("whatsapp")) {
              delete cleanedData.whatsapp;
              retryNeeded = true;
            }
            
            if (retryNeeded) {
              const { error: retryError } = await supabase.from('profiles_guru').update(cleanedData).eq('id', editingGuru.id);
              if (retryError) throw retryError;
            } else {
              throw error;
            }
          } else if (result && result.length > 0) {
            // Update local state immediately
            const updated = result[0];
            setGuruList(prev => prev.map(g => g.id === updated.id ? {
              ...g,
              name: updated.nama || updated.name || g.name,
              nip: updated.nip || g.nip,
              email: updated.email || g.email,
              phone: updated.phone || updated.whatsapp || g.phone,
              alamat: updated.alamat || g.alamat,
              password: updated.password || g.password,
              must_change_password: updated.must_change_password ?? g.must_change_password
            } : g));
          }
          if (userRole === 'Guru') setShowForcePasswordChange(false);
        } else {
          // New teachers must change password on first login
          data.must_change_password = true;
          // Default password if not provided
          if (!data.password) {
            data.password = '123456';
          }
          const { data: result, error } = await supabase.from('profiles_guru').insert([data]).select();
          if (error) {
            // Graceful degradation if column missing
            let cleanedData = { ...data };
            let retryNeeded = false;
            
            if (error.message.includes("must_change_password")) {
              delete cleanedData.must_change_password;
              retryNeeded = true;
            }
            if (error.message.includes("whatsapp")) {
              delete cleanedData.whatsapp;
              retryNeeded = true;
            }

            if (retryNeeded) {
              const { data: retryResult, error: retryError } = await supabase.from('profiles_guru').insert([cleanedData]).select();
              if (retryError) throw retryError;
              if (retryResult && retryResult.length > 0) {
                const nw = retryResult[0];
                const newTeacher: Teacher = {
                  id: nw.id,
                  name: nw.nama || nw.name || '',
                  nip: nw.nip || '',
                  email: nw.email || '',
                  phone: nw.phone || nw.whatsapp || '',
                  alamat: nw.alamat || '',
                  password: nw.password || '',
                  must_change_password: nw.must_change_password || false,
                  school_id: nw.school_id
                };
                setGuruList(prev => [newTeacher, ...prev]);
              }
            } else {
              throw error;
            }
          } else if (result && result.length > 0) {
            const nw = result[0];
            const newTeacher: Teacher = {
              id: nw.id,
              name: nw.nama || nw.name || '',
              nip: nw.nip || '',
              email: nw.email || '',
              phone: nw.phone || nw.whatsapp || '',
              alamat: nw.alamat || '',
              password: nw.password || '',
              must_change_password: nw.must_change_password || false,
              school_id: nw.school_id
            };
            setGuruList(prev => [newTeacher, ...prev]);
          }
        }
      };

      await performSave(payload);
      
      toast.success('Data guru berhasil disimpan');
      await fetchGuru();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Gagal menyimpan data guru: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
      if (!id.startsWith('temp')) {
        try {
          const { error } = await supabase.from('profiles_guru').delete().eq('id', id);
          if (error && !error.message.includes('Could not find the table')) throw error;
          toast.success('Data guru berhasil dihapus');
        } catch (err) {
          console.error(err);
          toast.error('Gagal menghapus data guru.');
        }
      }
      await fetchGuru();
    }
  };


  const downloadTemplate = () => {
    const data = [
      ["Nama", "NIP", "Email", "Telepon"],
      ["Dra. Siti Aminah", "19700512...", "siti@email.com", "08123456789"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Guru");
    XLSX.writeFile(wb, "template_import_guru.xlsx");
  };

  const exportData = () => {
    const data = guruList.map(g => ({
      Nama: g.name,
      NIP: g.nip,
      Email: g.email,
      Telepon: g.phone
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guru");
    XLSX.writeFile(wb, "data_guru_export.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !school) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedGuru = data.map((item, index) => ({
        nama: item.Nama || item.name || '',
        nip: String(item.NIP || item.nip || ''),
        email: item.Email || item.email || '',
        phone: item.Telepon || item.phone || String(item.phone || ''),
        school_id: school.npsn,
        password: String(item.Password || item.password || '123456'),
        must_change_password: true
      }));

      try {
        const { error } = await supabase.from('profiles_guru').insert(importedGuru);
        if (error) {
           if (error.message.includes('Could not find the table')) alert(`Simulasi selesai. Ditemukan ${importedGuru.length} data untuk diimport, tapi tabel profiles_guru tidak ada.`);
           else throw error;
        } else {
           alert(`${importedGuru.length} data guru berhasil diimport.`);
        }
      } catch (err) {
        console.error(err);
        alert('Gagal mengimport data guru ke database.');
      }
      
      await fetchGuru();
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredGuruList = userRole === 'Guru' && currentUserEmail 
    ? guruList.filter(g => g.email === currentUserEmail)
    : guruList;

  return (
    <div className="space-y-6 max-w-5xl">
      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
      
      {userRole === 'Guru' && showForcePasswordChange && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-xs font-black text-red-600 uppercase tracking-widest italic">Keamanan Akun: Password Default Terdeteksi</p>
            <p className="text-[10px] text-red-500 font-bold">Wajib ganti password sekarang demi keamanan data Anda.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main">
            {userRole === 'Guru' ? 'Profil Saya' : 'Tenaga Pengajar'}
          </h2>
          <p className="text-xs text-brand-text-muted">
            {userRole === 'Guru' 
              ? 'Data pribadi dan profil pengajar Anda' 
              : `Total ${guruList.length} Guru dan Staf Terdaftar`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => fetchGuru()}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          {userRole === 'Admin' && (
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
                onClick={exportData}
                className="flex items-center gap-2 bg-white border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:shadow-lg shadow-brand-accent/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Guru
              </button>
            </>
          )}
        </div>
      </div>

      <div className={cn(
        "grid grid-cols-1 gap-4",
        userRole === 'Admin' ? "md:grid-cols-2 lg:grid-cols-4" : "max-w-md"
      )}>
        {filteredGuruList.map((g) => (
          <motion.div 
            layout
            key={g.id} 
            className="bg-white p-4 rounded-xl border border-brand-border shadow-sm group hover:border-brand-accent transition-all flex flex-col items-center text-center relative"
          >
            <div className="absolute top-2 right-2 flex gap-2">
                       {(userRole === 'Admin' || currentUserEmail === g.email) && (
                         <div className="flex gap-2">
                           {userRole === 'Admin' && (
                             <button 
                               onClick={() => handleResetPassword(g)} 
                               className="p-1.5 bg-white border border-brand-border rounded-md transition-all text-slate-400 hover:text-orange-500 shadow-sm"
                               title="Reset Password"
                             >
                               <RefreshCw className="w-3 h-3" />
                             </button>
                           )}
                           <button 
                             onClick={() => handleOpenModal(g)} 
                             className="p-1.5 bg-white border border-brand-border rounded-md transition-all text-slate-400 hover:text-brand-accent shadow-sm"
                             title="Edit Guru"
                           >
                             <Edit2 className="w-3 h-3" />
                           </button>
                         </div>
                       )}
                       {userRole === 'Admin' && (
                         <button 
                           onClick={() => handleDelete(g.id)} 
                           className="p-1.5 bg-white border border-brand-border rounded-md transition-all text-slate-400 hover:text-red-500 shadow-sm"
                           title="Hapus Guru"
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                       )}
            </div>

            <div className="relative mb-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center font-bold text-brand-accent border-2 border-brand-border group-hover:border-brand-accent transition-colors text-lg">
                {g.name.split(' ').filter(n => n.length > 2).map(n => n[0]).join('').slice(0,2).toUpperCase() || g.name[0]}
              </div>
            </div>
            
            <div className="min-h-[40px]">
              <h3 className="font-bold text-xs text-brand-text-main uppercase mb-0.5">{g.name}</h3>
              <p className="text-[9px] text-brand-accent font-bold tracking-widest uppercase">ID: {g.nip}</p>
            </div>

            <div className="w-full mt-4 pt-4 border-t border-brand-border space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-bold group-hover:text-brand-text-main transition-colors">
                <Mail className="w-3 h-3" /> {g.email || 'Email Belum Ada'}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-bold group-hover:text-brand-text-main transition-colors">
                <Phone className="w-3 h-3" /> {g.phone || 'No. Telp Belum Ada'}
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (userRole === 'Admin' || currentUserEmail === g.email) {
                  handleOpenModal(g);
                } else {
                  alert('Hanya admin atau pemilik akun yang dapat mengedit biodata ini.');
                }
              }}
              className="w-full mt-4 py-2 bg-slate-50 group-hover:bg-brand-accent group-hover:text-white rounded-lg text-[9px] font-bold text-brand-text-muted transition-all uppercase tracking-widest"
            >
              Biodata Lengkap
            </button>
          </motion.div>
        ))}
      </div>

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
              className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-brand-border"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black text-brand-sidebar uppercase italic tracking-widest">
                      BIODATA <span className="text-brand-accent">GURU</span>
                    </h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {showForcePasswordChange && userRole === 'Guru' && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-3 mb-2">
                       <ShieldAlert className="w-4 h-4 text-red-500" />
                       <p className="text-[10px] font-bold text-red-600 uppercase">Wajib perbarui password Anda sebelum melanjutkan!</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-brand-accent">Nama Lengkap</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-brand-accent">NIP / ID Guru</label>
                      <input 
                        type="text" required
                        value={formData.nip}
                        onChange={(e) => setFormData({...formData, nip: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Telepon</label>
                      <input 
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Password Akses Portal</label>
                    <input 
                      type="text"
                      placeholder="Gunakan NIP atau buat password unik"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Alamat</label>
                    <textarea 
                      value={formData.alamat}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none h-20 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-brand-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50" disabled={isSaving}>Batal</button>
                    <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 bg-brand-sidebar text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} 
                      {isSaving ? 'Menyimpan...' : 'Simpan Data'}
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

