import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Users, 
  CreditCard,
  Building,
  Rocket,
  FileDown
} from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

const packages = [
  {
    id: 'basic',
    name: 'Paket Mandiri',
    price: 'Rp 450.000',
    period: '/tahun',
    description: 'Cocok untuk guru atau tutor individu yang ingin memulai kelas online.',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Hingga 50 Siswa',
      'Penyimpanan Materi 5GB',
      'Ujian & Kuis Otomatis',
      'Laporan Nilai Dasar',
      'Support via Email'
    ],
    color: 'brand-accent'
  },
  {
    id: 'pro',
    name: 'Paket Sekolah',
    price: 'Rp 1.250.000',
    period: '/tahun',
    description: 'Solusi lengkap untuk sekolah dengan fitur manajemen guru dan siswa.',
    icon: <Rocket className="w-6 h-6" />,
    popular: true,
    features: [
      'Hingga 500 Siswa',
      'Penyimpanan Materi 50GB',
      'Multi-Guru & Staf',
      'E-Raport & SKL Otomatis',
      'AI Assistant Integrasi',
      'Support Prioritas 24/7'
    ],
    color: 'brand-sidebar'
  },
  {
    id: 'enterprise',
    name: 'Paket Institusi',
    price: 'Custom',
    period: '',
    description: 'Untuk Yayasan atau Dinas Pendidikan dengan banyak cabang sekolah.',
    icon: <Building className="w-6 h-6" />,
    features: [
      'Siswa Tanpa Batas',
      'Penyimpanan Cloud Dedicated',
      'White-label (Logo Sendiri)',
      'API Integrasi Custom',
      'Dedicated Account Manager'
    ],
    color: 'slate-800'
  }
];

export default function Purchase() {
  const [selectedPackage, setSelectedPackage] = useState(packages[1]);
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadInvoice = () => {
    try {
      const amount = selectedPackage.id === 'basic' ? 450000 : selectedPackage.id === 'pro' ? 1250000 : 0;
      const date = new Date();
      const invoiceNumber = `INV/RC/${format(date, 'yyyy/MM')}/REG-${Math.floor(1000 + Math.random() * 9000)}`;

      generateInvoicePDF({
        invoiceNumber,
        date,
        schoolName: formData.schoolName || 'Institusi Baru',
        packageName: selectedPackage.name || 'Pendaftaran Armilla LMS',
        amount,
        paymentMethod,
        status: 'Pending',
        banks: paymentSettings.banks
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Gagal mengunduh invoice. Silakan coba lagi atau hubungi CS.");
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    npsn: '',
    accreditation: 'Belum Terakreditasi',
    address: '',
    email: '',
    phone: '',
    password: '',
    referralCode: new URLSearchParams(window.location.search).get('ref') || sessionStorage.getItem('rasya_ref') || '',
  });
  interface BankAccount {
    id: string;
    name: string;
    account: string;
    recipient: string;
  }

  interface EWalletAccount {
    id: string;
    name: string;
    number: string;
  }

  const [paymentSettings, setPaymentSettings] = useState({
    banks: [] as BankAccount[],
    ewallets: [] as EWalletAccount[],
    vaInfo: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'payment')
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setPaymentSettings({
            banks: data.banks || [],
            ewallets: data.ewallets || [],
            vaInfo: data.vaInfo || ''
          });
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Supabase Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Save Registration Data to Supabase
      const slug = formData.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const registrationId = `${slug}-${Date.now()}`;
      
      const { error: dbError } = await supabase.from('registrations').insert([{
        id: registrationId,
        owner_uid: authData.user?.id,
        name: formData.schoolName,
        npsn: formData.npsn,
        accreditation: formData.accreditation,
        address: formData.address,
        admin_name: formData.name,
        admin_email: formData.email,
        whatsapp: formData.phone,
        package_id: selectedPackage.id,
        payment_method: paymentMethod,
        referral_code: formData.referralCode,
        slug: slug,
        status: 'pending',
        created_at: new Date().toISOString(),
      }]);
      
      if (dbError) throw dbError;

      setStep(3);
    } catch (error: any) {
      console.error('Registration error details:', error);
      let errorMessage = 'Gagal mendaftar. Silakan coba lagi.';
      
      if (error.message && error.message.includes('already registered')) {
        errorMessage = 'Email ini sudah terdaftar. Silakan gunakan email lain atau hubungi admin.';
      } else if (error.message && error.message.includes('password')) {
        errorMessage = 'Password terlalu lemah. Mohon gunakan minimal 6 karakter.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-accent selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-brand-border py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-brand-sidebar rounded-xl flex items-center justify-center text-brand-accent font-black italic shadow-lg shadow-brand-sidebar/10 group-hover:scale-105 transition-transform">A</div>
          <span className="font-black text-brand-sidebar tracking-tighter text-xl italic uppercase">ARMILLA <span className="text-brand-accent">NUSA</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Butuh Bantuan?</span>
          <a href="#" className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-green-600 transition-colors">
            WhatsApp CS
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-16 px-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
            <div className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-accent z-0 transition-all duration-500",
              step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'
            )}></div>
            
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-black z-10 transition-colors duration-300",
                step >= i ? 'bg-brand-accent text-white' : 'bg-white border-2 border-slate-200 text-slate-300'
              )}>
                {step > i ? <Check className="w-5 h-5" /> : i}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <span className={cn("text-[10px] font-black uppercase tracking-widest italic", step === 1 ? 'text-brand-sidebar' : 'text-slate-400')}>Pilih Paket</span>
            <span className={cn("text-[10px] font-black uppercase tracking-widest italic", step === 2 ? 'text-brand-sidebar' : 'text-slate-400')}>Konfirmasi Data</span>
            <span className={cn("text-[10px] font-black uppercase tracking-widest italic", step === 3 ? 'text-brand-sidebar' : 'text-slate-400')}>Selesai</span>
          </div>
        </div>

        {step === 1 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-brand-sidebar italic uppercase leading-none tracking-tighter">
                INVESTASI <span className="text-brand-accent underline underline-offset-8">MASA DEPAN</span> PENDIDIKAN
              </h1>
              <p className="text-slate-500 font-medium">Pilih paket yang paling sesuai dengan kebutuhan institusi Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={cn(
                    "relative bg-white border-2 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 group",
                    selectedPackage.id === pkg.id 
                      ? "border-brand-accent shadow-2xl shadow-brand-accent/20 -translate-y-2" 
                      : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-sidebar text-brand-accent text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full border-2 border-white shadow-lg">
                      Paling Populer
                    </div>
                  )}

                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg transition-transform group-hover:scale-110",
                    pkg.id === 'basic' ? 'bg-brand-accent' : pkg.id === 'pro' ? 'bg-brand-sidebar' : 'bg-slate-800'
                  )}>
                    {pkg.icon}
                  </div>

                  <h3 className="font-black text-brand-sidebar uppercase italic text-xl mb-2 tracking-tight group-hover:text-brand-accent transition-colors">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-brand-sidebar tracking-tight">{pkg.price}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{pkg.period}</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-8 leading-relaxed">{pkg.description}</p>

                  <div className="space-y-4 mb-10">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors">
                          <Check className="w-3 h-3 text-brand-accent" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className={cn(
                    "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    selectedPackage.id === pkg.id
                      ? "bg-brand-sidebar text-white" 
                      : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                  )}>
                    {selectedPackage.id === pkg.id ? 'Terpilih' : 'Pilih Paket'}
                    {selectedPackage.id === pkg.id && <ArrowRight className="w-4 h-4 ml-2" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/"
                className="bg-white border-2 border-brand-sidebar text-brand-sidebar px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                Kembali ke Beranda
              </Link>
              <button 
                onClick={() => setStep(2)}
                className="bg-brand-accent text-brand-sidebar px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                Lanjutkan Pendaftaran <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : step === 2 ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Left: Summary */}
            <div className="space-y-8">
              <div className="bg-brand-sidebar rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Globe className="w-64 h-64 rotate-12" />
                </div>
                
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent italic mb-6 block">Order Summary</span>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8 leading-none">
                  KONFIRMASI <br />
                  <span className="text-brand-accent">PEMESANAN</span>
                </h2>

                <div className="space-y-6 pt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Paket Pilihan</span>
                    <span className="text-xl font-black italic uppercase text-brand-accent">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Total Investasi</span>
                    <span className="text-2xl font-black text-white">{selectedPackage.price}</span>
                  </div>
                  <div className="pt-6">
                    <p className="text-[10px] text-white/40 italic leading-relaxed font-medium">
                      * Harga sudah termasuk biaya setup awal dan pelatihan dasar operasional untuk tim admin/guru.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-brand-border rounded-3xl p-6 flex items-center gap-4 group hover:border-brand-accent transition-colors">
                  <div className="p-3 bg-brand-bg rounded-2xl text-brand-accent group-hover:bg-brand-accent group-hover:text-brand-sidebar transition-all">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400">Keamanan</h4>
                    <p className="text-xs font-bold text-brand-sidebar">Data Terenkripsi</p>
                  </div>
                </div>
                <div className="bg-white border border-brand-border rounded-3xl p-6 flex items-center gap-4 group hover:border-brand-accent transition-colors">
                  <div className="p-3 bg-brand-bg rounded-2xl text-brand-accent group-hover:bg-brand-accent group-hover:text-brand-sidebar transition-all">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400">Support</h4>
                    <p className="text-xs font-bold text-brand-sidebar">CS Indonesia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white border border-brand-border rounded-[2.5rem] p-10 shadow-lg">
              <h3 className="text-2xl font-black italic uppercase tracking-tight text-brand-sidebar mb-8">Data <span className="text-brand-accent">Pendaftar</span></h3>
              
              <form onSubmit={handleNext} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Nama Penanggung Jawab</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Nama Institusi / Sekolah</label>
                    <input 
                      type="text" 
                      required
                      value={formData.schoolName}
                      onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      placeholder="Contoh: SMA Negeri 1 Kemang"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">NPSN Sekolah</label>
                    <input 
                      type="text" 
                      required
                      value={formData.npsn}
                      onChange={(e) => setFormData({...formData, npsn: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      placeholder="8 digit nomor NPSN"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Akreditasi</label>
                    <select 
                      required
                      value={formData.accreditation}
                      onChange={(e) => setFormData({...formData, accreditation: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none appearance-none"
                    >
                      <option value="A (Unggul)">A (Unggul)</option>
                      <option value="B (Baik)">B (Baik)</option>
                      <option value="C (Cukup)">C (Cukup)</option>
                      <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Alamat Lengkap Sekolah</label>
                  <textarea 
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none resize-none"
                    placeholder="Jl. Pendidikan No. 1, Kota..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Alamat Email Aktif (Login)</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      placeholder="nama@sekolah.sch.id"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Buat Password Login</label>
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      placeholder="Min. 6 karakter"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                    placeholder="0812XXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Kode Referal (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.referralCode}
                    onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 px-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                    placeholder="Contoh: AFFILIATE123"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Metode Pembayaran Utama</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Transfer Bank', 'E-Wallet', 'VA Online'].map((m) => (
                      <div 
                        key={m} 
                        onClick={() => setPaymentMethod(m)}
                        className={cn(
                          "bg-slate-50 border rounded-xl p-3 flex flex-col items-center gap-2 group cursor-pointer transition-all",
                          paymentMethod === m 
                            ? "border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/20" 
                            : "border-brand-border hover:border-brand-accent/40"
                        )}
                      >
                        <CreditCard className={cn(
                          "w-5 h-5 transition-colors",
                          paymentMethod === m ? "text-brand-accent" : "text-slate-400"
                        )} />
                        <span className={cn(
                          "text-[8px] font-black uppercase transition-colors",
                          paymentMethod === m ? "text-brand-sidebar" : "text-slate-400"
                        )}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Kembali
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] bg-brand-sidebar text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-sidebar/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? 'Memproses...' : 'Selesaikan Pembelian'} <Rocket className={cn("w-5 h-5", isLoading && "animate-bounce")} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white border border-brand-border rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-sidebar via-brand-accent to-brand-sidebar"></div>
             
             <div className="w-24 h-24 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <ShieldCheck className="w-12 h-12 text-brand-accent" />
             </div>

             <h2 className="text-4xl font-black italic uppercase tracking-tighter text-brand-sidebar leading-none mb-6">
                PENDAFTARAN <br />
                <span className="text-brand-accent">BERHASIL DITERIMA!</span>
             </h2>

             <div className="space-y-6 text-slate-600 font-medium mb-12">
                <p className="">
                   Terima kasih <span className="font-black text-brand-sidebar uppercase italic">{formData.name}</span>, pendaftaran untuk <span className="font-black text-brand-sidebar italic">{formData.schoolName}</span> telah kami catat di sistem.
                </p>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] space-y-4 text-left">
                    <div className="bg-white border border-brand-accent/20 p-6 rounded-3xl mb-6 shadow-sm">
                       <h5 className="text-[10px] font-black text-brand-sidebar uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-50 pb-3">
                          <CreditCard className="w-4 h-4 text-brand-accent" /> Pilih Rekening Pembayaran ({paymentMethod})
                       </h5>
                       {paymentMethod === 'Transfer Bank' ? (
                          <div className="space-y-4">
                             {paymentSettings.banks.map((bank) => (
                                <div key={bank.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 group hover:border-brand-accent transition-all">
                                   <div className="flex justify-between items-center border-b border-brand-accent/10 pb-2">
                                      <span className="text-[12px] font-black text-brand-sidebar uppercase italic">{bank.name}</span>
                                      <span className="text-[10px] font-black text-slate-500 italic uppercase">{bank.recipient}</span>
                                   </div>
                                   <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Rekening</span>
                                      <span className="text-lg font-black text-brand-accent tracking-[0.2em] font-mono">{bank.account}</span>
                                   </div>
                                </div>
                             ))}
                             {paymentSettings.banks.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic text-center p-4">Hubungi Admin untuk info rekening.</p>
                             )}
                          </div>
                       ) : paymentMethod === 'E-Wallet' ? (
                          <div className="space-y-3">
                             {paymentSettings.ewallets.map((wallet) => (
                                <div key={wallet.id} className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-brand-accent transition-all">
                                   <span className="text-[11px] font-black text-brand-sidebar uppercase italic">{wallet.name}</span>
                                   <span className="text-lg font-black text-brand-accent tracking-widest font-mono">{wallet.number}</span>
                                </div>
                             ))}
                             {paymentSettings.ewallets.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic text-center p-4">Hubungi Admin untuk info e-wallet.</p>
                             )}
                          </div>
                       ) : (
                          <div className="text-[11px] text-slate-600 font-bold uppercase italic p-6 bg-slate-50 rounded-2xl text-center leading-relaxed whitespace-pre-line border border-slate-100">
                             {paymentSettings.vaInfo || 'Instruksi Virtual Account akan dikirimkan menyusul setelah pendaftaran divalidasi.'}
                          </div>
                       )}
                    </div>

                   <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-brand-sidebar text-brand-accent flex items-center justify-center text-[10px] font-black shrink-0 mt-1">1</div>
                      <p className="text-[11px] font-bold text-brand-sidebar uppercase tracking-tight">Silakan selesaikan pembayaran sesuai detail di atas.</p>
                   </div>
                   <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-brand-sidebar text-brand-accent flex items-center justify-center text-[10px] font-black shrink-0 mt-1">2</div>
                      <p className="text-[11px] font-bold text-brand-sidebar uppercase tracking-tight">Admin kami akan memvalidasi pembayaran Anda dalam waktu maksimal 1x24 jam.</p>
                   </div>
                   <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-brand-sidebar text-brand-accent flex items-center justify-center text-[10px] font-black shrink-0 mt-1">3</div>
                      <p className="text-[11px] font-bold text-brand-sidebar uppercase tracking-tight">Cek email <span className="text-brand-accent underline">{formData.email}</span> untuk mendapatkan link login sekolah baru Anda.</p>
                   </div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleDownloadInvoice}
                  className="bg-brand-sidebar text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-sidebar/20 flex items-center justify-center gap-2 italic"
                >
                  <FileDown className="w-4 h-4 text-brand-accent" /> Download Invoice
                </button>
                <Link 
                  to="/"
                  className="bg-slate-100 text-slate-500 px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all italic border border-slate-200"
                >
                  Beranda
                </Link>
                <a 
                  href={`https://wa.me/6285225025555?text=Halo%20Admin%20Rasyacomp,%20saya%20ingin%20konfirmasi%20pendaftaran%20sekolah%20${encodeURIComponent(formData.schoolName)}`}
                  target="_blank"
                  className="bg-green-500 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 italic"
                >
                  WhatsApp Konfirmasi
                </a>
             </div>
          </motion.div>
        )}
      </main>

      <footer className="bg-brand-sidebar py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-8">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-brand-sidebar font-black italic">A</div>
             <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">© 2024 ARMILLA NUSA EDUCATION TECHNOLOGY</span>
           </div>
           <div className="flex gap-6">
             <a href="#" className="text-white/30 hover:text-brand-accent text-[10px] font-bold uppercase tracking-widest transition-colors">Syarat & Ketentuan</a>
             <a href="#" className="text-white/30 hover:text-brand-accent text-[10px] font-bold uppercase tracking-widest transition-colors">Kebijakan Privasi</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
