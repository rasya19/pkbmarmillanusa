import React, { useState, useEffect } from 'react';
import { UserPlus, Sparkles, X, Check, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StudentRegistration {
  id: string;
  name: string;
  paket: string;
  whatsapp: string;
  email: string;
  jk: string;
  nik: string;
  created_at: string; // Updated name
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export default function PPDB() {
  const { school } = useSchool();
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    nik: '',
    noAkta: '',
    email: '',
    whatsapp: '',
    paket: 'Paket C',
    jk: 'Laki-Laki',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    alamat: '',
    anakKe: 1,
    namaAyah: '',
    pekerjaanAyah: '',
    penghasilanAyah: '0 - 500.000',
    namaIbu: '',
    pekerjaanIbu: '',
    penghasilanIbu: '0 - 500.000',
    alasan: ''
  });

  // Fetch registrations
  const fetchRegistrations = async () => {
    if (!school?.id) return;
    const { data, error } = await supabase
      .from('ppdb_registrations')
      .select('*')
      .eq('school_name', school.name)
      .order('created_at', { ascending: false });

    console.log('DEBUG [PPDB] Data yang diterima:', data);
    console.log('DEBUG [PPDB] Error:', error);

    if (error) {
      console.error("Error fetching registrations:", error);
    } else {
      setRegistrations(data || []);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [school?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('ppdb_registrations').insert([
        {
          ...formData,
          school_name: school.name,
          status: 'PENDING',
          created_at: new Date().toISOString()
        }
      ]);
      
      if (error) throw error;
      fetchRegistrations();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Gagal mengirim pendaftaran.');
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleApprove = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('ppdb_registrations')
        .update({
          status: 'VERIFIED',
          is_approved: true
        })
        .eq('id', id);
        
      if (error) throw error;
      fetchRegistrations();
      toast.success('Pendaftar berhasil diverifikasi!');
    } catch (error: any) {
      toast.error('Gagal verifikasi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToStudent = async (applicant: any) => {
    if (!window.confirm(`Konversi ${applicant.name} menjadi siswa aktif di ${school?.name}?`)) return;
    
    try {
      setIsLoading(true);
      
      // 1. Prepare student data from applicant
      const studentData = {
        school_id: school?.slug || applicant.school_id,
        nama: applicant.name,
        nisn: applicant.nisn || '',
        whatsapp: applicant.whatsapp || '',
        class: applicant.kelas || applicant.class || applicant.paket || 'Paket C',
        status: 'Aktif'
      };

      // 2. Insert into profiles_siswa
      const { error: insertError } = await supabase
        .from('profiles_siswa')
        .insert([studentData]);

      if (insertError) throw insertError;

      // 3. Update PPDB status to CONVERTED
      const { error: updateError } = await supabase
        .from('ppdb_registrations')
        .update({ status: 'CONVERTED' })
        .eq('id', applicant.id);

      if (updateError) throw updateError;

      toast.success(`${applicant.name} berhasil terdaftar sebagai siswa aktif!`);
      fetchRegistrations();
    } catch (error: any) {
      console.error('Conversion Error:', error);
      toast.error('Gagal konversi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.whatsapp?.includes(searchTerm)
  );

  const handleClose = () => {
    setIsFormOpen(false);
    setIsSubmitted(false);
    setFormData({
      name: '',
      nisn: '',
      nik: '',
      noAkta: '',
      email: '',
      whatsapp: '',
      paket: 'Paket C',
      jk: 'Laki-Laki',
      tempatLahir: '',
      tanggalLahir: '',
      agama: 'Islam',
      alamat: '',
      anakKe: 1,
      namaAyah: '',
      pekerjaanAyah: '',
      penghasilanAyah: '0 - 500.000',
      namaIbu: '',
      pekerjaanIbu: '',
      penghasilanIbu: '0 - 500.000',
      alasan: ''
    });
  };

  return (
    <div className="max-w-6xl space-y-8">
       {/* Header Section */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-brand-sidebar tracking-tighter">
              Data <span className="text-brand-accent">Pendaftar</span> PPDB
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
              Manajemen penerimaan siswa baru {school?.name}
            </p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-brand-sidebar text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all italic flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Input Pendaftar Baru
          </button>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Pendaftar', value: registrations.length, color: 'text-brand-sidebar' },
            { label: 'Pending', value: registrations.filter(r => r.status === 'PENDING').length, color: 'text-orange-500' },
            { label: 'Verified', value: registrations.filter(r => r.status === 'VERIFIED').length, color: 'text-emerald-500' },
            { label: 'Rejected', value: registrations.filter(r => r.status === 'REJECTED').length, color: 'text-red-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-brand-border shadow-sm">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">{stat.label}</p>
               <h3 className={cn("text-3xl font-black italic", stat.color)}>{stat.value.toString().padStart(2, '0')}</h3>
            </div>
          ))}
       </div>

       {/* List View */}
       <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
             <div className="flex-1 max-w-md relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau nomor WhatsApp..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-brand-accent transition-all"
                />
             </div>
             <div className="flex items-center gap-3">
                <button className="p-3 bg-slate-50 rounded-xl text-brand-sidebar hover:bg-brand-accent hover:text-white transition-all">
                   <Filter className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="overflow-x-auto overflow-y-hidden">
             <table className="w-full min-w-[800px]">
                <thead>
                   <tr className="text-left border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Info Pendaftar</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Paket & Gender</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Kontak</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Tgl Daftar</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Status</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((r) => (
                         <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center font-black text-brand-sidebar italic">
                                     {r.name?.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-brand-sidebar italic">{r.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400">NIK: {r.nik}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="py-4">
                               <span className="text-[10px] font-black bg-brand-accent/10 px-2 py-1 rounded text-brand-accent italic mb-1 inline-block">{r.paket}</span>
                               <p className="text-[10px] font-bold text-slate-400">{r.jk}</p>
                            </td>
                            <td className="py-4">
                               <p className="text-[10px] font-bold text-brand-sidebar">{r.whatsapp}</p>
                               <p className="text-[10px] text-slate-400">{r.email}</p>
                            </td>
                            <td className="py-4 text-[10px] font-bold text-slate-400">
                               {r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy') : '-'}
                            </td>
                            <td className="py-4">
                               <span className={cn(
                                 "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic",
                                 r.status === 'PENDING' ? "bg-orange-100 text-orange-600" :
                                 r.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                               )}>
                                  {r.status || 'PENDING'}
                               </span>
                            </td>
                            <td className="py-4">
                               <div className="flex items-center gap-2">
                                  <button title="Edit" className="p-2 text-slate-400 hover:text-brand-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                  <button title="Hapus" className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                               </div>
                            </td>
                         </tr>
                      ))
                   ) : (
                      <tr>
                         <td colSpan={6} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-300">
                               <UserPlus className="w-12 h-12" />
                               <p className="text-xs font-black uppercase tracking-widest italic">Belum ada data pendaftar</p>
                            </div>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-brand-sidebar/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-brand-border"
            >
              {!isSubmitted ? (
                <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-black text-brand-sidebar uppercase italic tracking-widest leading-none">FORMULIR <span className="text-brand-accent">PENDAFTARAN</span></h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Input manual data calon siswa baru</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Data Pribadi */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-brand-sidebar uppercase tracking-[0.2em] italic flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> 1. Data Pribadi Calon Siswa
                        <div className="h-[1px] bg-brand-border flex-1" />
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nama Lengkap Sesuai Ijazah</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nama lengkap..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nomor NIK (KTP/KK)</label>
                          <input type="text" required value={formData.nik} onChange={(e) => setFormData({...formData, nik: e.target.value})} placeholder="16 digit NIK..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">NISN (Jika Ada)</label>
                          <input type="text" value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})} placeholder="10 digit NISN..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">No Akta Lahir</label>
                          <input type="text" value={formData.noAkta} onChange={(e) => setFormData({...formData, noAkta: e.target.value})} placeholder="No. Registrasi Akta..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Jenis Kelamin</label>
                          <select value={formData.jk} onChange={(e) => setFormData({...formData, jk: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none">
                            <option value="Laki-Laki">Laki-Laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Agama</label>
                          <select value={formData.agama} onChange={(e) => setFormData({...formData, agama: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none">
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Budha">Budha</option>
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Anak Ke</label>
                          <input type="number" value={formData.anakKe} onChange={(e) => setFormData({...formData, anakKe: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tempat Lahir</label>
                          <input type="text" value={formData.tempatLahir} onChange={(e) => setFormData({...formData, tempatLahir: e.target.value})} placeholder="Kabupaten/Kota..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tanggal Lahir</label>
                          <input type="date" value={formData.tanggalLahir} onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})} className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Kontak & Alamat */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-brand-sidebar uppercase tracking-[0.2em] italic flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> 2. Kontak & Alamat
                        <div className="h-[1px] bg-brand-border flex-1" />
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email Aktif</label>
                          <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contoh@email.com" className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nomor WhatsApp</label>
                          <input type="text" required value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="0812..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Alamat Lengkap</label>
                        <textarea value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} placeholder="Nama jalan, Desa, Kec, Kab/Kota..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none h-24 resize-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Program yang Dipilih</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Paket A', 'Paket B', 'Paket C'].map((p) => (
                            <button key={p} type="button" onClick={() => setFormData({...formData, paket: p})} className={cn("p-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all", formData.paket === p ? "bg-brand-sidebar text-white border-brand-sidebar shadow-lg" : "bg-white border-brand-border text-slate-400 hover:border-brand-accent")}>{p}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Alasan Mendaftar / Catatan Tambahan</label>
                      <textarea value={formData.alasan} onChange={(e) => setFormData({...formData, alasan: e.target.value})} placeholder="Berikan alasan singkat..." className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold focus:border-brand-accent outline-none h-24 resize-none" />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-brand-sidebar text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-sidebar/20 italic">
                      {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Simpan Pendaftaran <Check className="w-4 h-4" /></>}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black text-brand-sidebar mb-2 italic uppercase">Pendaftaran Tersimpan!</h3>
                  <p className="text-xs text-slate-500 italic max-w-sm mx-auto mb-8">
                    Data pendaftaran telah berhasil disimpan ke sistem dan muncul di daftar pendaftar.
                  </p>
                  <button 
                    onClick={handleClose}
                    className="bg-brand-sidebar text-white px-10 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-sidebar/20"
                  >
                    Tutup & Kembali
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
       </AnimatePresence>
    </div>
  );
}
