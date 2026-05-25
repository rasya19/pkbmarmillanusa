import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Rocket, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RegisterSchool() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    npsn: '',
    adminName: '',
    adminEmail: '',
    whatsapp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slugVal = formData.name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      console.log('DEBUG [Registration] Sending payload:', {
        school_name: formData.name,
        subdomain: slugVal,
        whatsapp: formData.whatsapp,
        status: 'pending'
      });

      const { error } = await supabase.from('registrations').insert([{
        school_name: formData.name,
        subdomain: slugVal,
        whatsapp: formData.whatsapp,
        status: 'pending'
      }]);
      
      if (error) {
        console.error('Supabase Registration Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      toast.success('Pendaftaran sekolah berhasil! Mohon tunggu verifikasi.');
      
      // whatsapp notification
      const message = `Halo Rasyatech, sekolah baru "${formData.name}" (NPSN: ${formData.npsn}) telah mendaftar. Mohon segera dilakukan verifikasi.`;
      const waUrl = `https://wa.me/6281918226387?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      navigate('/');
    } catch (error: any) {
      console.error('Registration Error:', error);
      const errorMessage = error.message || 'Terjadi kesalahan tidak diketahui';
      toast.error(`Gagal mendaftar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg p-10 rounded-[2.5rem] shadow-xl border border-brand-border overflow-hidden relative">
        <AnimatePresence>
          {loading && (
            <>
              <motion.div 
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="absolute top-0 left-0 right-0 h-1.5 bg-brand-accent shadow-[0_0_10px_rgba(30,209,119,0.5)] z-50"
              />
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-4"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-brand-sidebar animate-spin" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-brand-accent/20 rounded-full blur-xl"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-brand-sidebar uppercase italic tracking-widest animate-pulse">Memproses Pendaftaran...</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Mohon tunggu sebentar</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <h2 className="text-2xl font-black text-brand-sidebar uppercase italic tracking-tighter mb-8">Daftar Sekolah Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" placeholder="Nama Sekolah" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="text" placeholder="NPSN" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, npsn: e.target.value})} />
          <input type="text" placeholder="Nama Admin" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, adminName: e.target.value})} />
          <input type="email" placeholder="Email Admin" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, adminEmail: e.target.value})} />
          <input type="text" placeholder="whatsapp (08...)" required className="w-full p-4 rounded-xl border border-brand-border text-sm" onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          <button disabled={loading} className="w-full bg-brand-sidebar text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Rocket />} Kirim Pendaftaran
          </button>
        </form>
      </div>
    </div>
  );
}
