import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  userId: string;
  role: 'Guru' | 'Siswa';
  onSuccess: () => void;
}

export default function ForcePasswordChangeModal({ isOpen, userId, role, onSuccess }: ForcePasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const handleUpdate = async () => {
    if (!isValid) return;
    
    setSaving(true);
    try {
      // 1. Verify and Refresh Session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        await supabase.auth.refreshSession();
      }

      // 2. Update Auth Password
      const { error: authError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      if (authError) throw authError;

      // 3. Update Profile flag (Double-tap naming convention for safety, resilient to schema)
      const table = role === 'Siswa' ? 'profiles_siswa' : 'profiles_guru';
      let dbError: any = null;
      try {
        const { error } = await supabase
          .from(table)
          .update({ 
            must_change_password: false,
            harus_mengubah_kata_sandi: false
          })
          .eq('id', userId);
        dbError = error;
      } catch (err) {
        dbError = err;
      }

      if (dbError) {
        // Try without must_change_password
        try {
          const { error } = await supabase
            .from(table)
            .update({ 
              harus_mengubah_kata_sandi: false
            })
            .eq('id', userId);
          dbError = error;
        } catch (err) {
          dbError = err;
        }
      }

      if (dbError) {
        // Try without harus_mengubah_kata_sandi
        try {
          const { error } = await supabase
            .from(table)
            .update({ 
              must_change_password: false
            })
            .eq('id', userId);
          dbError = error;
        } catch (err) {
          dbError = err;
        }
      }

      // If both fail but it's just missing columns, we can proceed anyway since auth password succeeded
      if (dbError && !dbError.message?.includes('column') && !dbError.message?.includes('does not exist')) {
        throw dbError;
      }

      toast.success('Keamanan Berhasil Diperbarui! Selamat datang di dashboard.');
      onSuccess();
    } catch (err: any) {
      toast.error('Gagal memperbarui: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-center border-4 border-emerald-500/10"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">
              Keamanan <span className="text-emerald-500">Pertama</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 leading-relaxed max-w-[250px] mx-auto">
              Demi keamanan akun, silakan ganti password default Anda sebelum mengakses dashboard.
            </p>

            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Masukkan Password Baru</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Minimal 6 karakter"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300",
                    confirmPassword && newPassword !== confirmPassword ? "border-red-200 focus:border-red-500" : "border-slate-100 focus:border-emerald-500"
                  )}
                  placeholder="Ulangi password di atas"
                />
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight text-center animate-pulse">
                   Password tidak cocok!
                </p>
              )}

              <button 
                onClick={handleUpdate}
                disabled={saving || !isValid}
                className={cn(
                  "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl mt-4",
                  isValid 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-500/20" 
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Aktifkan & Lanjut ke Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
