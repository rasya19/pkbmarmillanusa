import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Plus, Download, X, Check, FileUp, FileDown, Edit2, Trash2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
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

export default function TeacherManagement() {
  const { school } = useSchool();
  const [guruList, setGuruList] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (school) fetchGuru();
  }, [school]);

  const fetchGuru = async () => {
    if (!school) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles_guru')
        .select('*')
        .eq('school_id', school.slug)
        .order('created_at', { ascending: false });
      
      if (error && !error.message.includes('Could not find the table')) {
        console.error('Error fetching guru:', error);
        toast.error('Gagal mengambil data guru: ' + error.message);
        return;
      }

      if (data) {
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
      const payload: any = { 
        password: '12345678',
        must_change_password: true 
      };

      const { error } = await supabase
        .from('profiles_guru')
        .update(payload)
        .eq('id', teacher.id);

      if (error) {
           if (error.message.includes("must_change_password")) {
             delete payload.must_change_password;
             const { error: retry } = await supabase.from('profiles_guru').update(payload).eq('id', teacher.id);
             if (retry) throw retry;
           } else {
             throw error;
           }
      }
      
      toast.success('Password berhasil direset');
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
        whatsapp: formData.phone,
        alamat: formData.alamat,
        password: formData.password || '123456',
        school_id: school.slug
      };

      if (editingGuru && editingGuru.id && !editingGuru.id.startsWith('temp')) {
        const { error } = await supabase.from('profiles_guru').update(payload).eq('id', editingGuru.id);
        if (error) throw error;
      } else {
        const payloadWithPass = {
          ...payload,
          must_change_password: true
        };
        const { error } = await supabase.from('profiles_guru').insert([payloadWithPass]);
        
        if (error) {
          console.warn('Insert with must_change_password failed, retrying without it...', error);
          const { error: retryError } = await supabase.from('profiles_guru').insert([payload]);
          if (retryError) throw retryError;
        }
      }

      toast.success('Data guru berhasil disimpan');
      fetchGuru();
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus data guru ini?')) {
      await supabase.from('profiles_guru').delete().eq('id', id);
      fetchGuru();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" accept=".xlsx, .xls" />
      
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-brand-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main uppercase italic">Tenaga Pengajar</h2>
          <p className="text-xs text-brand-text-muted">Manajemen data guru dan staf ({guruList.length} orang)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchGuru()}
            className="p-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-sidebar hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-accent/20 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" /> Tambah Guru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guruList.map((g) => (
          <motion.div layout key={g.id} className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm hover:border-brand-accent transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-bold text-brand-accent border-2 border-brand-border group-hover:border-brand-accent">
                {g.name[0].toUpperCase()}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleResetPassword(g)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={() => handleOpenModal(g)} className="p-2 text-slate-400 hover:text-brand-accent hover:bg-brand-bg rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(g.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <h3 className="font-bold text-sm text-brand-sidebar uppercase">{g.name}</h3>
            <p className="text-[10px] text-brand-accent font-black tracking-widest uppercase mt-1">NIP: {g.nip}</p>

            <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Mail className="w-3.5 h-3.5" /> {g.email || '-'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Phone className="w-3.5 h-3.5" /> {g.phone || '-'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-sidebar/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative border border-brand-border">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-brand-sidebar uppercase italic">BIODATA <span className="text-brand-accent">GURU</span></h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-brand-accent ml-1">Nama Lengkap</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-accent/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-brand-accent ml-1">NIP / ID Guru</label>
                    <input type="text" required value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-accent/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-accent/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Telepon</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-accent/20" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Password</label>
                  <input type="text" placeholder="Default: 123456" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-accent/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Alamat</label>
                  <textarea value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs font-bold outline-none h-20 resize-none" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-brand-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-brand-sidebar text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Simpan Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
