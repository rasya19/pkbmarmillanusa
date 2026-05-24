import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, ShieldCheck, Check, X, Search, Filter, 
  ExternalLink, Loader2, Rocket, Globe, 
  Settings, Building2, UserPlus, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Registration {
  id: string;
  school_name: string;
  npsn: string;
  admin_name: string;
  admin_email: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  slug?: string;
  subscription_plan?: 'Silver' | 'Gold' | 'Platinum';
}

export default function MasterAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const getInitialTab = () => {
    if (tabParam === 'billing') return 'Tagihan SaaS';
    if (tabParam === 'affiliate') return 'Manajemen Afiliasi';
    if (tabParam === 'ppdb') return 'PPDB Global';
    return 'Registrasi Sekolah';
  };

  const [activeTab, setActiveTab] = useState<'Registrasi Sekolah' | 'PPDB Global' | 'Tagihan SaaS' | 'Manajemen Afiliasi'>(getInitialTab());

  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [tabParam]);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (tab === 'Tagihan SaaS') setSearchParams({ tab: 'billing' });
    else if (tab === 'Manajemen Afiliasi') setSearchParams({ tab: 'affiliate' });
    else if (tab === 'PPDB Global') setSearchParams({ tab: 'ppdb' });
    else setSearchParams({});
  };
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [studentRegistrations, setStudentRegistrations] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([
    { id: 'AF-001', name: 'Bambang Sudarto', school_name: 'PKBM Cahaya Baru', code: 'RASYA-BMB', clicks: 124, referrals: 3, commission: 450000, status: 'Active' },
    { id: 'AF-002', name: 'Linda Permata', school_name: 'SDIT Al-Ikhlas', code: 'RASYA-LND', clicks: 89, referrals: 1, commission: 150000, status: 'Pending' },
    { id: 'AF-003', name: 'Heri Kurniawan', school_name: 'MA Persatuan', code: 'RASYA-HER', clicks: 210, referrals: 5, commission: 750000, status: 'Active' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');
  const isSuperAdmin = userEmail?.trim().toLowerCase() === 'ismanto095@gmail.com' || userRole === 'SuperAdmin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [activeTab, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black text-brand-sidebar uppercase italic">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 italic">Maaf, halaman ini hanya dapat diakses oleh Super Admin Rasyatech.</p>
          <a href="/" className="inline-block mt-4 bg-brand-sidebar text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest italic">Kembali ke Beranda</a>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'Registrasi Sekolah') {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRegistrations(data || []);
      } else {
        const { data, error } = await supabase
          .from('ppdb_registrations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setStudentRegistrations(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mengambil data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSchool = async (reg: Registration) => {
    console.log('DEBUG [Approval] Initiating for:', reg);
    if (!window.confirm(`Setujui pendaftaran ${reg.school_name}?`)) return;
    
    // 1. Slug generation (needs to happen first so we can save it)
    let slugVal = (reg.slug || reg.school_name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '') 
      .replace(/\s+/g, '-')     
      .replace(/-+/g, '-')).toLowerCase();
    
    if (!slugVal || slugVal === '-') {
      slugVal = `school-${Math.random().toString(36).substring(2, 8)}`;
    }

    setProcessingId(reg.id);
    try {
      // 2. Update registration status and slug
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ 
          status: 'approved',
          slug: slugVal,
          school_slug: slugVal
        })
        .eq('id', reg.id);
      
      if (updateError) {
        console.error('DEBUG [Approval] Registration Update Error:', updateError);
        throw new Error(`Gagal update status: ${updateError.message}`);
      }

      console.log('DEBUG [Approval] Slug generated:', slugVal);

      // 3. Upsert into schools table (Avoid sending Slug to UUID ID column)
      const schoolData = {
        name: reg.school_name,
        school_name: reg.school_name,
        slug: slugVal,
        school_slug: slugVal,
        npsn: reg.npsn,
        is_active: true,
        subscription_plan: reg.subscription_plan || 'Silver',
        whatsapp: reg.whatsapp
      };

      // We use school_slug or slug as the conflict target or upsert by slug if it's unique
      const { error: schoolError } = await supabase
        .from('schools')
        .upsert([schoolData], { onConflict: 'slug' });

      if (schoolError) {
        console.error('DEBUG [Approval] Schools Upsert Error:', schoolError);
        // Final fallback try with simple insert if upsert is rejected by policies
        const { error: insertError } = await supabase
          .from('schools')
          .insert([schoolData]);
          
        if (insertError && insertError.code !== '23505') {
          throw new Error(`Gagal buat data sekolah: ${insertError.message}`);
        }
      }

      // 4. Create/Update User Profile for the School Admin
      // This ensures the admin user is associated with their new school
      if (reg.admin_email) {
        console.log('DEBUG [Approval] Creating/Updating User Profile for:', reg.admin_email);
        
        // Search if profile already exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', reg.admin_email.toLowerCase().trim())
            .single();

        if (existingProfile) {
            // Update existing profile with new school_id and role Admin
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                    school_id: slugVal,
                    role: 'Admin',
                    nama: reg.admin_name,
                    subscription_plan: reg.subscription_plan || 'Silver',
                    is_approved: true
                })
                .eq('id', existingProfile.id);
            
            if (profileError) console.error('DEBUG [Approval] Profile Update Error:', profileError);
        } else {
            // Create new profile record (auth will be handled by Supabase Auth if they sign up/login)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    email: reg.admin_email.toLowerCase().trim(),
                    nama: reg.admin_name,
                    role: 'Admin',
                    school_id: slugVal,
                    subscription_plan: reg.subscription_plan || 'Silver',
                    is_approved: true
                }]);
            
            if (profileError) console.error('DEBUG [Approval] Profile Insert Error:', profileError);
        }
      }

      toast.success(`${reg.school_name} berhasil diaktifkan!`);
      fetchData();
    } catch (error: any) {
      console.error('DEBUG [Approval] Fatal Error:', error);
      toast.error(error.message || 'Error tidak dikenal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSchool = async (id: string) => {
    if (!window.confirm('Tolak pendaftaran ini?')) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Pendaftaran ditolak.');
      fetchData();
    } catch (error) {
      toast.error('Gagal mengubah status.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRegistrations = registrations.filter(r => 
    r.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.npsn.includes(searchTerm)
  );

  const filteredStudents = studentRegistrations.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-sidebar text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic mb-2">
            <ShieldCheck className="w-3 h-3" /> Master Control Panel
          </div>
          <h1 className="text-4xl font-black italic uppercase text-brand-sidebar tracking-tighter leading-none">
            Manajemen <span className="text-brand-accent text-5xl">Pendaftar</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">
            Pusat Kendali Registrasi Sekolah & Siswa Global
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-brand-border shadow-sm overflow-x-auto max-w-full">
          {['Registrasi Sekolah', 'PPDB Global', 'Tagihan SaaS', 'Manajemen Afiliasi'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as any)}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-brand-sidebar text-white shadow-lg italic" 
                  : "text-slate-400 hover:text-brand-sidebar"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengajuan', value: registrations.length, icon: Building2, color: 'text-brand-sidebar' },
          { label: 'Menunggu Verifikasi', value: registrations.filter(r => r.status === 'pending').length, icon: Zap, color: 'text-orange-500' },
          { label: 'Sekolah Aktif', value: registrations.filter(r => r.status === 'approved').length, icon: Globe, color: 'text-emerald-500' },
          { label: 'Total Siswa Baru', value: studentRegistrations.length, icon: Users, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-brand-border shadow-sm group hover:border-brand-accent transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-xl bg-slate-50", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">{stat.label}</p>
            <h3 className="text-2xl font-black italic text-brand-sidebar tracking-tighter">{stat.value.toString().padStart(2, '0')}</h3>
          </div>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-brand-border rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'Registrasi Sekolah' ? "Cari nama sekolah atau NPSN..." : "Cari nama siswa atau sekolah..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-brand-accent transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-sidebar transition-all">
                <Filter className="w-4 h-4" /> Filter Data
             </button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          {activeTab === 'Registrasi Sekolah' ? (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Institusi Sekolah</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Admin Penghubung</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Kontak</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Tgl Daftar</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Status</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand-accent mx-auto" /></td></tr>
                ) : filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((r) => (
                    <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-[1rem] flex items-center justify-center font-black text-brand-sidebar italic text-xl group-hover:bg-brand-accent group-hover:text-white transition-all">
                            {r.school_name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-brand-sidebar italic uppercase tracking-tight">{r.school_name}</p>
                            <p className="text-[10px] font-bold text-slate-400">NPSN: {r.npsn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <p className="text-xs font-black text-brand-sidebar uppercase italic">{r.admin_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{r.admin_email}</p>
                      </td>
                      <td className="py-6">
                        <a 
                          href={`https://wa.me/${r.whatsapp}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black italic hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <Check className="w-3 h-3" /> {r.whatsapp}
                        </a>
                      </td>
                      <td className="py-6 text-[10px] font-bold text-slate-400 italic">
                        {r.created_at ? format(new Date(r.created_at), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="py-6">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic shadow-sm",
                          r.status === 'pending' ? "bg-orange-100 text-orange-600" :
                          r.status === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {r.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApproveSchool(r)}
                                disabled={processingId === r.id}
                                className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                              >
                                {processingId === r.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Approve'}
                              </button>
                              <button 
                                onClick={() => handleRejectSchool(r.id)}
                                disabled={processingId === r.id}
                                className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {r.status === 'approved' && (
                             <a 
                               href={`https://${r.slug || r.school_name.toLowerCase().replace(/ /g, '-')}.rsch.my.id`}
                               target="_blank"
                               rel="noreferrer"
                               className="text-slate-400 hover:text-brand-accent transition-colors"
                             >
                               <ExternalLink className="w-4 h-4" />
                             </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="py-20 text-center"><p className="text-xs font-black uppercase text-slate-300 italic tracking-widest">Belum ada pendaftaran masuk</p></td></tr>
                )}
              </tbody>
            </table>
          ) : activeTab === 'Manajemen Afiliasi' ? (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Agen Afiliasi</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Kode Referral</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Klik / Ref</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Komisi</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand-accent mx-auto" /></td></tr>
                ) : affiliates.length > 0 ? (
                  affiliates.map((a) => (
                    <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center font-black text-brand-sidebar italic">
                            {a.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-brand-sidebar italic uppercase tracking-tight">{a.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{a.school_name || 'Personal Agent'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black text-brand-sidebar italic">{a.code}</code>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-500 uppercase">{a.clicks} Klik</span>
                          <span className="text-[9px] font-bold text-brand-accent uppercase">{a.referrals} Pendaftaran</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-brand-sidebar italic">Rp {a.commission.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Estimasi Akhir Bulan</span>
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic shadow-sm",
                          a.status === 'Active' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-300"><p className="text-xs font-black italic uppercase">Belum ada agen afiliasi terdaftar</p></td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Calon Siswa</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Institusi Tujuan</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Paket & Gender</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Kontak</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic text-right">Status PPDB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand-accent mx-auto" /></td></tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((r: any) => (
                    <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center font-black text-brand-sidebar italic">
                            {r.name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-brand-sidebar italic uppercase tracking-tight">{r.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">NIK: {r.nik}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-2">
                           <Building2 className="w-3 h-3 text-brand-accent" />
                           <span className="text-[10px] font-black text-brand-sidebar uppercase italic">{r.school_name}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="text-[9px] font-black bg-brand-accent/10 px-2.5 py-1 rounded-lg text-brand-accent italic mb-1 inline-block uppercase">{r.paket}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{r.jk}</p>
                      </td>
                      <td className="py-6">
                        <p className="text-[10px] font-bold text-brand-sidebar">{r.whatsapp}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{r.email}</p>
                      </td>
                      <td className="py-6 text-right">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic shadow-sm",
                          r.status === 'PENDING' ? "bg-orange-100 text-orange-600" :
                          r.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {r.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : activeTab === 'Tagihan SaaS' ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-300"><p className="text-xs font-black italic uppercase">Fitur Manajemen Billing SaaS (Segera Hadir)</p></td></tr>
                ) : (
                   <tr><td colSpan={5} className="py-20 text-center text-slate-300"><p className="text-xs font-black italic uppercase">Belum ada siswa mendaftar PPDB</p></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
