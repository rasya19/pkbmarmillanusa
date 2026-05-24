import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, TrendingUp, Link as LinkIcon, 
  Copy, Check, Search, Download, ExternalLink,
  Loader2, AlertCircle, Rocket, Zap, Heart,
  ShieldCheck, ArrowRight, Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function AffiliateDashboard() {
  const [stats, setStats] = useState({
    totalReferrals: '0',
    totalConversions: '0',
    totalEarnings: 'Rp 0',
    currentBalance: 'Rp 0'
  });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const affiliateId = localStorage.getItem('affiliateId') || 'RASYA-PARTNER-001';
  const referralLink = `${window.location.origin}/purchase?ref=${affiliateId}`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('referralCode', affiliateId);
        
      if (error) throw error;
      
      const formattedData = data || [];
      
      setReferrals(formattedData);
      setStats({
        totalReferrals: formattedData.length.toString(),
        totalConversions: formattedData.filter(s => s.status === 'approved').length.toString(),
        totalEarnings: `Rp ${(formattedData.length * 500000).toLocaleString('id-ID')}`,
        currentBalance: `Rp ${(formattedData.length * 350000).toLocaleString('id-ID')}`
      });
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      toast.error('Gagal mengambil data referral.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link referral berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      {/* Hero Header */}
      <div className="bg-brand-sidebar p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/20 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic text-brand-accent">
                 <Award className="w-4 h-4" /> Affiliate Partner Program
              </div>
              <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.85]">
                 Wujudkan <br />
                 <span className="text-brand-accent">Passive Income</span> <br />
                 Pendidikan.
              </h1>
              <p className="text-sm font-medium text-slate-400 italic max-w-md leading-relaxed">
                 Bagikan link referral Anda dan dapatkan komisi hingga <span className="text-white font-black">Rp 500.000</span> untuk setiap sekolah yang mendaftar melalui Anda.
              </p>
           </div>

           <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Link Referral Eksklusif Anda</p>
              <div className="flex flex-col sm:flex-row gap-3">
                 <div className="flex-1 bg-slate-950/50 border border-white/10 rounded-2xl p-4 font-mono text-xs text-brand-accent overflow-hidden whitespace-nowrap overflow-ellipsis">
                    {referralLink}
                 </div>
                 <button 
                   onClick={handleCopy}
                   className="bg-brand-accent text-brand-sidebar px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-accent/20"
                 >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Tersalin' : 'Salin Link'}
                 </button>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-[9px] font-bold uppercase italic">
                 <Zap className="w-3 h-3 text-brand-accent" /> Share di WhatsApp, FB, & Instagram untuk hasil maksimal!
              </div>
           </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Klik', value: '1.2k', icon: Zap, color: 'text-amber-400' },
           { label: 'Referral Aktif', value: stats.totalReferrals, icon: Users, color: 'text-brand-accent' },
           { label: 'Total Komisi', value: stats.totalEarnings, icon: DollarSign, color: 'text-emerald-400' },
           { label: 'Saldo Tersedia', value: stats.currentBalance, icon: TrendingUp, color: 'text-blue-400' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[2rem] border border-brand-border shadow-sm group hover:border-brand-accent transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className={cn("p-3 rounded-2xl bg-slate-50 group-hover:bg-brand-accent/10 transition-colors", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                 </div>
                 <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-brand-accent transition-colors" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-black text-brand-sidebar italic uppercase tracking-tighter">{stat.value}</h3>
           </div>
         ))}
      </div>

      {/* Referrals Table */}
      <div className="bg-white border border-brand-border rounded-[3rem] p-8 shadow-sm overflow-hidden">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-brand-accent" /> Referral Activity
            </h2>
            <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-accent transition-colors">
               <Download className="w-4 h-4" /> Download Report
            </button>
         </div>

         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                  <tr className="border-b border-brand-border">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Institusi Sekolah</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tgl Daftar</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Paket</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Potensi Komisi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                       <td colSpan={5} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-brand-accent mx-auto" />
                       </td>
                    </tr>
                  ) : referrals.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="py-20 text-center">
                          <Rocket className="w-12 h-12 text-brand-bg mx-auto mb-4" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Mulai bagikan link Anda untuk mendapatkan komisi pertama!</p>
                       </td>
                    </tr>
                  ) : referrals.map((r) => (
                    <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-brand-sidebar text-lg italic group-hover:bg-brand-accent group-hover:text-white transition-all">
                                {r.school_name?.[0]}
                             </div>
                             <div>
                                <p className="text-xs font-black text-brand-sidebar uppercase italic tracking-tight">{r.school_name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Domain: {r.subdomain}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                             {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : 'Memproses...'}
                          </p>
                       </td>
                       <td className="px-6 py-6 font-mono text-[10px] font-black text-brand-sidebar uppercase italic tracking-widest">
                          {r.packageId}
                       </td>
                       <td className="px-6 py-6">
                          <div className="flex items-center gap-1.5">
                             <div className={cn("w-1.5 h-1.5 rounded-full", r.status === 'active' ? 'bg-emerald-500' : 'bg-orange-500')} />
                             <span className={cn("text-[9px] font-black uppercase tracking-widest", r.status === 'active' ? 'text-emerald-500' : 'text-orange-500')}>
                                {r.status === 'active' ? 'TERBAYAR' : 'PENDING'}
                             </span>
                          </div>
                       </td>
                       <td className="px-6 py-6 text-right">
                          <p className="text-sm font-black text-brand-accent tracking-tighter italic">Rp 500.000</p>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
