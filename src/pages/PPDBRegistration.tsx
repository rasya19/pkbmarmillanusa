import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, ShieldCheck, GraduationCap, Phone, Mail, User, Lock, Hash, MapPin, Users, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function PPDBRegistration() {
  const { school } = useSchool();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Data Pribadi
    name: '',
    gender: 'Laki-laki',
    nisn: '',
    nik: '',
    birth_place: '',
    birth_date: '',
    religion: 'Islam',
    rt: '',
    rw: '',
    dusun: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    kode_pos: '',
    whatsapp: '',
    email: '',
    password: '',

    // Step 2: Data Orang Tua
    mother_name: '',
    mother_nik: '',
    father_name: '',
    father_nik: '',
    parent_occupation: '',

    // Step 3: Data Khusus
    paket: 'Paket C',
    last_education_status: '',
    last_ijazah_number: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!formData.name || !formData.nisn || !formData.nik || !formData.whatsapp || !formData.password) {
        toast.error('Mohon lengkapi data wajib (Nama, NISN, NIK, WA, Password)');
        return false;
      }
      if (formData.nisn.length !== 10) {
        toast.error('NISN harus 10 digit');
        return false;
      }
      if (formData.nik.length !== 16) {
        toast.error('NIK harus 16 digit');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.mother_name || !formData.mother_nik) {
        toast.error('Nama dan NIK Ibu Kandung wajib diisi');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const schoolSlug = school?.slug || 'pkbmarmillanusa';
      const schoolName = school?.name || 'PKBM Armilla Nusa';

      const { error } = await supabase.from('ppdb_registrations').insert([
        {
          ...formData,
          school_id: schoolSlug,
          school_name: schoolName,
          status: 'PENDING',
          created_at: new Date().toISOString()
        }
      ]);
      
      if (error) throw error;
      
      setIsSubmitted(true);
      toast.success('Pendaftaran PPDB Berhasil!');
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      toast.error('Gagal mengirim pendaftaran: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-brand-sidebar uppercase italic tracking-tight mb-4">Pendaftaran <span className="text-emerald-500">Berhasil!</span></h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mb-10 italic">
            Terima kasih telah mendaftar di {school?.name || 'PKBM Armilla Nusa'}. Data Anda telah masuk ke sistem kami dan sedang ditinjau. Tim kami akan segera menghubungi Anda.
          </p>
          <a href="/" className="inline-flex items-center gap-3 bg-brand-sidebar text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-sidebar/20 hover:scale-105 active:scale-95 transition-all italic">
            Kembali ke Beranda <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Data Pribadi', icon: User },
    { id: 2, title: 'Orang Tua', icon: Users },
    { id: 3, title: 'Kesetaraan', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand-sidebar/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12 px-4">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-full border border-brand-border mb-6"
          >
            <ShieldCheck className="w-3 h-3 text-brand-accent" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-sidebar italic">PPDB Online TA 2024/2025</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-brand-sidebar italic uppercase tracking-tighter leading-[0.9]"
          >
            Formulir <span className="text-brand-accent">Pendaftaran</span> <br /> Dapodik Terintegrasi
          </motion.h1>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  step >= s.id ? "bg-brand-sidebar text-white shadow-lg shadow-brand-sidebar/20" : "bg-slate-100 text-slate-400"
                )}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest italic",
                    step >= s.id ? "text-brand-sidebar" : "text-slate-400"
                  )}>Kategori {s.id}</p>
                  <p className={cn(
                    "text-[9px] font-bold uppercase italic",
                    step >= s.id ? "text-brand-accent" : "text-slate-300"
                  )}>{s.title}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-[2px] -mt-8 transition-all duration-500",
                  step > s.id ? "bg-brand-sidebar" : "bg-slate-100"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white border border-brand-border rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <User className="w-3 h-3 text-brand-accent" /> Nama Lengkap Sesuai Akta/KK
                       </label>
                       <input 
                         type="text" 
                         required 
                         value={formData.name} 
                         onChange={(e) => setFormData({...formData, name: e.target.value})} 
                         placeholder="Masukkan nama lengkap..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Users className="w-3 h-3 text-brand-accent" /> Jenis Kelamin
                       </label>
                       <div className="flex gap-4">
                         {['Laki-laki', 'Perempuan'].map(g => (
                           <button
                             key={g}
                             type="button"
                             onClick={() => setFormData({...formData, gender: g})}
                             className={cn(
                               "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all italic",
                               formData.gender === g ? "bg-brand-sidebar text-white border-brand-sidebar" : "bg-white border-brand-border text-slate-400"
                             )}
                           >
                             {g}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Hash className="w-3 h-3 text-brand-accent" /> NISN (10 Digit)
                       </label>
                       <input 
                         type="text" 
                         required 
                         maxLength={10}
                         value={formData.nisn} 
                         onChange={(e) => setFormData({...formData, nisn: e.target.value.replace(/\D/g, '')})} 
                         placeholder="10 digit NISN..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3 text-brand-accent" /> NIK / No. KTP (16 Digit)
                       </label>
                       <input 
                         type="text" 
                         required 
                         maxLength={16}
                         value={formData.nik} 
                         onChange={(e) => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})} 
                         placeholder="16 digit NIK..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <MapPin className="w-3 h-3 text-brand-accent" /> Tempat Lahir
                       </label>
                       <input 
                         type="text" 
                         value={formData.birth_place} 
                         onChange={(e) => setFormData({...formData, birth_place: e.target.value})} 
                         placeholder="Contoh: Jakarta" 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Calendar className="w-3 h-3 text-brand-accent" /> Tanggal Lahir
                       </label>
                       <input 
                         type="date" 
                         value={formData.birth_date} 
                         onChange={(e) => setFormData({...formData, birth_date: e.target.value})} 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Hash className="w-3 h-3 text-brand-accent" /> Agama
                       </label>
                       <select 
                         value={formData.religion} 
                         onChange={(e) => setFormData({...formData, religion: e.target.value})} 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic appearance-none"
                       >
                         {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Khonghucu'].map(religion => (
                           <option key={religion} value={religion}>{religion}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <MapPin className="w-3 h-3 text-brand-accent" /> Kode Pos
                       </label>
                       <input 
                         type="text" 
                         maxLength={5}
                         value={formData.kode_pos} 
                         onChange={(e) => setFormData({...formData, kode_pos: e.target.value.replace(/\D/g, '')})} 
                         placeholder="5 digit kode pos..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Alamat Lengkap</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <input placeholder="RT" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} className="bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold italic" />
                      <input placeholder="RW" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} className="bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold italic" />
                      <input placeholder="Dusun" value={formData.dusun} onChange={e => setFormData({...formData, dusun: e.target.value})} className="bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold italic col-span-2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input placeholder="Desa/Kelurahan" value={formData.desa} onChange={e => setFormData({...formData, desa: e.target.value})} className="bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold italic" />
                      <input placeholder="Kecamatan" value={formData.kecamatan} onChange={e => setFormData({...formData, kecamatan: e.target.value})} className="bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold italic" />
                      <input placeholder="Kabupaten" value={formData.kabupaten} onChange={e => setFormData({...formData, kabupaten: e.target.value})} className="bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold italic" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Phone className="w-3 h-3 text-brand-accent" /> HP/WhatsApp
                       </label>
                       <input 
                         type="text" 
                         value={formData.whatsapp} 
                         onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} 
                         placeholder="0812..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Lock className="w-3 h-3 text-brand-accent" /> Buat Kata Sandi Akun
                       </label>
                       <input 
                         type="password" 
                         required 
                         value={formData.password} 
                         onChange={(e) => setFormData({...formData, password: e.target.value})} 
                         placeholder="Akan digunakan untuk login nantinya..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Users className="w-3 h-3 text-brand-accent" /> Nama Ibu Kandung (Sesuai KK)
                       </label>
                       <input 
                         required 
                         value={formData.mother_name} 
                         onChange={(e) => setFormData({...formData, mother_name: e.target.value})} 
                         placeholder="Wajib diisi..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3 text-brand-accent" /> NIK Ibu Kandung
                       </label>
                       <input 
                         required 
                         maxLength={16}
                         value={formData.mother_nik} 
                         onChange={(e) => setFormData({...formData, mother_nik: e.target.value.replace(/\D/g, '')})} 
                         placeholder="16 digit NIK..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Users className="w-3 h-3 text-brand-accent" /> Nama Ayah Kandung
                       </label>
                       <input 
                         value={formData.father_name} 
                         onChange={(e) => setFormData({...formData, father_name: e.target.value})} 
                         placeholder="Nama Ayah..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3 text-brand-accent" /> NIK Ayah Kandung
                       </label>
                       <input 
                         maxLength={16}
                         value={formData.father_nik} 
                         onChange={(e) => setFormData({...formData, father_nik: e.target.value.replace(/\D/g, '')})} 
                         placeholder="16 digit NIK..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                       <Lock className="w-3 h-3 text-brand-accent" /> Pekerjaan Orang Tua
                     </label>
                     <input 
                       value={formData.parent_occupation} 
                       onChange={(e) => setFormData({...formData, parent_occupation: e.target.value})} 
                       placeholder="Contoh: Buruh harian lepas, PNS, Guru, dll..." 
                       className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                     />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Pilih Program Paket Kesetaraan</label>
                     <div className="grid grid-cols-3 gap-3">
                        {['Paket A', 'Paket B', 'Paket C'].map((p) => (
                          <button 
                            key={p} 
                            type="button" 
                            onClick={() => setFormData({...formData, paket: p})} 
                            className={cn(
                              "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all italic",
                              formData.paket === p ? "bg-brand-sidebar text-white border-brand-sidebar" : "bg-white border-brand-border text-slate-400"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <BookOpen className="w-3 h-3 text-brand-accent" /> Status Pendidikan Terakhir
                       </label>
                       <input 
                         value={formData.last_education_status} 
                         onChange={(e) => setFormData({...formData, last_education_status: e.target.value})} 
                         placeholder="Contoh: Lulus SMP Tahun 2020..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                         <Hash className="w-3 h-3 text-brand-accent" /> Nomor Seri Ijazah Terakhir
                       </label>
                       <input 
                         value={formData.last_ijazah_number} 
                         onChange={(e) => setFormData({...formData, last_ijazah_number: e.target.value})} 
                         placeholder="Nomor Ijazah..." 
                         className="w-full bg-slate-50 border border-brand-border rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-accent transition-all italic"
                       />
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 italic">
                    <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                      Saya menyatakan bahwa data yang saya masukkan adalah benar sesuai dengan dokumen asli (Akta Lahir/KK/Ijazah). Segala kesalahan data menjadi tanggung jawab pendaftar.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 flex items-center gap-4">
              {step > 1 && (
                <button 
                  onClick={prevStep}
                  className="px-8 py-5 rounded-2xl border-2 border-brand-border text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all italic flex items-center gap-3"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
              )}
              
              {step < 3 ? (
                <button 
                  onClick={() => validateStep(step) && nextStep()}
                  className="flex-1 bg-brand-sidebar text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-sidebar/20 italic"
                >
                  Lanjut ke Tahap Berikutnya <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-brand-sidebar text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-sidebar/20 italic"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Kirim Pendaftaran Dapodik <Check className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

