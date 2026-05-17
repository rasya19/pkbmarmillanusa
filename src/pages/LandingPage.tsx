import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SCHOOL_NAME, getSchoolParts } from '../constants';
import { useSchool } from '../contexts/SchoolContext';
import { 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  Instagram,
  Facebook,
  Rocket,
  Zap,
  Heart,
  MessageCircle,
  Award,
  DollarSign,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import AdBanner from '@/src/components/AdBanner';

export default function LandingPage() {
  const { school } = useSchool();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    // Detect referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      sessionStorage.setItem('rasya_ref', ref);
      console.log('Referral code detected and stored:', ref);
    }
  }, []);

  const schoolName = school?.name || SCHOOL_NAME;
  const parts = school?.name 
    ? { first: school.name.split(' ')[0], rest: school.name.split(' ').slice(1).join(' ') }
    : getSchoolParts();

  const accreditation = school?.accreditation || localStorage.getItem('school_accreditation') || 'A (UNGGUL)';
  const npsn = school?.npsn || localStorage.getItem('school_npsn') || '6987****';
  const address = school?.address || localStorage.getItem('school_address') || 'Perum Grand Lebakwangi Lestari Desa Mekarwangi Kec. Lebakwangi Kab. Kuningan';
  const phone = school?.whatsapp || localStorage.getItem('school_phone') || '+62 852-2502-5555';
  const email = school?.adminEmail || localStorage.getItem('school_email') || 'pkbmarmillanusa@gmail.com';

  const navLinks = [
    { name: 'Tentang Kami', href: '#tentang-kami' },
    { name: 'Fasilitas', href: '#fasilitas' },
    { name: 'Program', href: '#program' },
    { name: 'Berita', href: '#berita' },
    { name: 'Kontak', href: '#kontak' },
  ];

  return (
    <div className="bg-white font-sans selection:bg-brand-accent selection:text-white scroll-smooth relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-brand-border z-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
             {school?.logoUrl ? (
                <img 
                  src={school.logoUrl} 
                  alt={school.name} 
                  className="w-11 h-11 object-contain bg-white rounded-xl shadow-lg shadow-brand-accent/20 p-1 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
             ) : (
                <div className="w-11 h-11 bg-brand-sidebar rounded-xl flex items-center justify-center text-brand-accent font-black italic shadow-lg shadow-brand-sidebar/20 group-hover:scale-105 transition-transform">
                   {parts.first ? parts.first[0] : 'A'}
                </div>
             )}
             <div className="flex flex-col">
                <span className="font-black text-brand-sidebar uppercase italic tracking-tighter leading-none text-xl">
                  {parts.first} <span className="text-brand-accent">{parts.rest}</span>
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Powered by <span className="text-brand-accent">Rasyatech</span></span>
             </div>
          </Link>
          
          {/* Desktop Nav */}
           <div className="hidden lg:flex items-center gap-8">
            <Link to="/register-school" className="text-[11px] font-bold text-slate-500 hover:text-brand-accent transition-colors uppercase tracking-widest italic">
              Daftar Sekolah Baru
            </Link>
            <Link to="/register-user" className="text-[11px] font-bold text-slate-500 hover:text-brand-accent transition-colors uppercase tracking-widest italic">
              Registrasi User
            </Link>
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className={cn(
                  "text-[11px] font-bold transition-colors uppercase tracking-widest",
                  link.name === 'Berita' 
                    ? "text-brand-sidebar flex items-center gap-1.5" 
                    : "text-slate-500 hover:text-brand-accent"
                )}
              >
                {link.name === 'Berita' && <div className="w-1 h-1 bg-brand-accent rounded-full animate-pulse" />}
                {link.name}
              </a>
            ))}
            {!school && (
              <Link to="/affiliate" className="text-[11px] font-bold text-slate-500 hover:text-brand-accent transition-colors uppercase tracking-widest flex items-center gap-2 italic">
                Affiliate <Users className="w-3.5 h-3.5 text-brand-accent" />
              </Link>
            )}
            <Link to="/login" className="bg-brand-sidebar text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent hover:scale-105 transition-all shadow-xl shadow-brand-sidebar/20 italic">
              Portal Masuk
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-brand-sidebar hover:bg-slate-100 rounded-xl transition-all"
          >
            {isMenuOpen ? <Zap className="w-6 h-6 rotate-45 text-brand-accent" /> : <ArrowRight className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-brand-border overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-bold text-brand-sidebar uppercase tracking-widest flex items-center justify-between group"
                  >
                    {link.name}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
                <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-brand-border">
                  {!school && (
                    <Link 
                      to="/affiliate" 
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl text-center text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 italic"
                    >
                      Daftar Affiliate <Users className="w-4 h-4 text-brand-sidebar" />
                    </Link>
                  )}
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full bg-brand-sidebar text-white py-4 rounded-xl text-center text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 italic"
                  >
                    Portal Masuk <ShieldCheck className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
           <div className="absolute top-20 right-10 w-96 h-96 bg-brand-accent/30 rounded-full blur-[120px]" />
           <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-sidebar/30 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           >
              <div className="inline-flex items-center gap-3 bg-white border border-brand-border px-4 py-2 rounded-2xl text-[10px] font-black text-brand-sidebar uppercase tracking-[0.2em] mb-10 shadow-sm">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 TERAKREDITASI {accreditation}
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-brand-sidebar leading-[0.85] tracking-tighter italic mb-10 group">
                MEMBANGUN <br />
                MASA DEPAN <br />
                <span className="text-brand-accent group-hover:text-brand-sidebar transition-colors duration-500">TANPA BATAS.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium italic mb-12 max-w-xl leading-relaxed">
                Pusat Kegiatan Belajar Masyarakat (PKBM) yang mengutamakan kualitas, fleksibilitas, dan kemajuan teknologi untuk mencerdaskan bangsa Indonesia.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-12">
                 <Link to="/login" className="bg-brand-sidebar text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-brand-sidebar/40 flex flex-col items-center justify-center gap-1 group/btn hover:scale-105 active:scale-95 transition-all italic h-32">
                    <Users className="w-6 h-6 mb-2 text-brand-accent" />
                    <span>LOGIN GURU</span>
                 </Link>
                 <Link to="/login" className="bg-brand-accent text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-brand-accent/40 flex flex-col items-center justify-center gap-1 group/btn hover:scale-105 active:scale-95 transition-all italic h-32">
                    <BookOpen className="w-6 h-6 mb-2 text-brand-sidebar" />
                    <span>LOGIN SISWA</span>
                 </Link>
              </div>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
             className="relative"
           >
              <div className="aspect-[4/5] bg-brand-bg md:rounded-[5rem] rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-white group">
                  <img 
                    src="https://images.unsplash.com/photo-1523050338392-06ba56741d72?w=1200&auto=format&fit=crop&q=90" 
                    alt="School Building" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-sidebar/90 via-brand-sidebar/20 to-transparent flex flex-col justify-end p-12 text-white">
                     <p className="text-5xl font-black italic tracking-tighter mb-2">{schoolName}</p>
                     <p className="text-[10px] text-brand-accent font-black uppercase tracking-[0.3em] bg-white/10 backdrop-blur-md self-start px-4 py-2 rounded-full border border-white/20 uppercase">
                      NPSN: {npsn} • KEMENDIKBUD
                     </p>
                  </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-accent rounded-full border-[15px] border-white flex flex-col items-center justify-center text-white rotate-12 shadow-2xl">
                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Rank</span>
                 <span className="text-5xl font-black italic">#1</span>
                 <span className="text-[8px] font-bold uppercase tracking-tighter leading-none mt-1">PKBM TERBAIK</span>
              </div>
           </motion.div>
        </div>
      </header>

      {/* Stats Section moved into About Us */}
      <section id="tentang-kami" className="py-32 px-6 bg-brand-sidebar text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
            <h2 className="text-[20vw] font-black text-white/5 whitespace-nowrap italic tracking-tighter">ABOUT{schoolName}</h2>
         </div>
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
               <div>
                  <h3 className="text-brand-accent font-black uppercase tracking-[0.4em] text-xs mb-6">Profil Institusi</h3>
                  <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9] mb-10">
                    Mencerdaskan <br />
                    Masyarakat Lewat <br />
                    <span className="text-brand-accent">Inovasi Digital.</span>
                  </h2>
               </div>
               <div className="space-y-8">
                  <p className="text-lg text-slate-300 font-medium italic leading-relaxed">
                    PKBM {schoolName} hadir sebagai solusi pendidikan alternatif yang setara dan bermartabat. Kami percaya bahwa setiap orang berhak mendapatkan pendidikan tanpa batasan usia, waktu, dan tempat.
                  </p>
                  <p className="text-slate-400 italic text-sm leading-relaxed">
                    Dengan bimbingan tutor profesional dan dukungan infrastruktur teknologi dari Rasyacomp, kami memastikan setiap warga belajar mendapatkan pengalaman pendidikan yang relevan dengan kebutuhan zaman.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center py-12 border-y border-white/10">
               {(() => {
                 const savedStats = localStorage.getItem('school_stats');
                 const stats = savedStats ? JSON.parse(savedStats) : [
                   { label: 'Peserta Didik', value: '2.5k+' },
                   { label: 'Guru Ahli', value: '45+' },
                   { label: 'Alumni Sukses', value: '1.2k+' },
                   { label: 'Program Unggul', value: '12' },
                 ];
                 return stats.map((stat: any, i: number) => (
                   <div key={i}>
                     <p className="text-4xl md:text-7xl font-black tracking-tighter text-brand-accent mb-2 italic leading-none">{stat.value}</p>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</p>
                   </div>
                 ));
               })()}
            </div>
         </div>
      </section>

      {/* Facilities Section */}
      <section id="fasilitas" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h3 className="text-brand-accent font-black uppercase tracking-[0.4em] text-xs mb-6">Fasilitas Kampus</h3>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.9]">
                Lingkungan Belajar <br />
                <span className="text-brand-accent">Yang Modern.</span>
              </h2>
            </div>
            <div className="md:text-right">
              <p className="text-slate-500 italic font-medium max-w-sm ml-auto">
                Kami menyediakan sarana terbaik untuk mendukung kenyamanan dan fokus belajar siswa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              const savedFacilities = localStorage.getItem('school_facilities');
              const facilities = savedFacilities ? JSON.parse(savedFacilities) : [
                { name: 'Laboratorium Komputer', img: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&auto=format&fit=crop' },
                { name: 'Ruang Kelas Nyaman', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop' },
                { name: 'Perpustakaan Digital', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop' },
                { name: 'Area Kreatif', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop' },
              ];
              return facilities.map((f: any, i: number) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-[2.5rem] bg-brand-sidebar shadow-lg">
                  <img src={f.img} alt={f.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-sidebar/80 to-transparent flex flex-col justify-end p-8">
                    <span className="text-white font-black italic text-lg uppercase leading-none tracking-tighter">{f.name}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="program" className="py-32 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="mb-24 text-center">
               <h2 className="text-5xl font-black text-brand-sidebar italic uppercase tracking-tighter">Program <span className="text-brand-accent">Pendidikan</span></h2>
               <div className="w-32 h-2 bg-brand-accent mx-auto mt-6 rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {(() => {
                 const savedPrograms = localStorage.getItem('school_programs');
                 const programs = savedPrograms ? JSON.parse(savedPrograms) : [
                   { title: 'Kesetaraan Paket A, B, C', desc: 'Layanan pendidikan non-formal setara SD, SMP, dan SMA untuk semua usia dengan ijazah resmi.', icon: BookOpen },
                   { title: 'Vokasi & Keterampilan', desc: 'Kursus praktis menjahit, komputer, dan kewirausahaan untuk bekal langsung ke dunia kerja.', icon: ShieldCheck },
                   { title: 'LMS Terintegrasi AI', desc: 'Platform belajar modern berbasis cloud dengan asisten AI eksklusif untuk kemudahan belajar.', icon: Users },
                 ];
                 const icons = [BookOpen, ShieldCheck, Users, Rocket, Zap, Heart];
                 
                 return programs.map((p: any, i: number) => {
                   const Icon = icons[i % icons.length];
                   return (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      className="group p-12 bg-white rounded-[3rem] border border-brand-border hover:border-brand-accent transition-all cursor-default shadow-sm hover:shadow-2xl hover:shadow-brand-accent/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-bg rounded-bl-full -mr-10 -mt-10 group-hover:bg-brand-accent/5 transition-colors" />
                        <Icon className="w-16 h-16 text-brand-accent mb-10 group-hover:scale-110 transition-transform relative z-10" />
                        <h3 className="text-2xl font-black text-brand-sidebar italic mb-6 uppercase tracking-tighter leading-tight relative z-10">{p.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed italic relative z-10">{p.desc}</p>
                        <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-brand-accent uppercase tracking-widest relative z-10">
                           Pelajari Selengkapnya <ArrowRight className="w-4 h-4" />
                        </div>
                    </motion.div>
                   );
                 });
               })()}
            </div>
         </div>
      </section>

      {/* Berita/Pengumuman Terbaru */}
      <section id="berita" className="py-32 px-6 bg-slate-50">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
               <div>
                  <h2 className="text-3xl font-bold text-brand-sidebar italic uppercase">Berita & <span className="text-brand-accent">Informasi</span></h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2 italic">Update terbaru dari {schoolName}</p>
               </div>
               <Link to="/pengumuman" className="text-xs font-black text-brand-accent uppercase tracking-widest border-b-2 border-brand-accent pb-1">Lihat Semua Berita</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {(() => {
                 const savedBerita = localStorage.getItem('school_berita');
                 const displayBerita = savedBerita ? JSON.parse(savedBerita).slice(0, 3) : [
                   { 
                     title: 'Pembukaan Pendaftaran Siswa Baru Tahun Pelajaran 2026/2027', 
                     date: '15 Mei 2026', 
                     category: 'PPDB',
                     img: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop'
                   },
                   { 
                     title: 'Workshop Kewirausahaan Digital Bersama Rasyacomp', 
                     date: '10 Mei 2026', 
                     category: 'Workshop',
                     img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop'
                   }
                 ];

                 return displayBerita.map((news: any, i: number) => (
                   <motion.div 
                     key={news.id || i}
                     whileHover={{ y: -10 }}
                     className="bg-white rounded-3xl overflow-hidden border border-brand-border shadow-sm group cursor-pointer"
                   >
                      <div className="h-48 overflow-hidden relative">
                         <img src={news.img || undefined} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         <div className="absolute top-4 left-4 bg-brand-sidebar text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{news.category}</div>
                      </div>
                      <div className="p-6">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{news.date}</p>
                         <h3 className="text-lg font-bold text-brand-sidebar italic leading-tight group-hover:text-brand-accent transition-colors">{news.title}</h3>
                         <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-brand-sidebar uppercase tracking-widest">
                            Selengkapnya <ArrowRight className="w-3 h-3" />
                         </div>
                      </div>
                   </motion.div>
                 ));
               })()}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-slate-50 border-t border-brand-border py-20 px-6">
         <AdBanner className="w-full mb-16 opacity-80" slot="Footer Banner" />
         {(() => {
           const savedContact = localStorage.getItem('school_contact');
           const contact = savedContact ? JSON.parse(savedContact) : {
             address: 'Perum Grand Lebakwangi Lestari Desa Mekarwangi Kec. Lebakwangi Kab. Kuningan',
             phone: '+62 852-2502-5555',
             email: 'pkbmarmillanusa@gmail.com'
           };
           return (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
               <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                   {school?.logoUrl ? (
                      <img 
                        src={school.logoUrl} 
                        alt={school.name} 
                        className="w-10 h-10 object-contain bg-white rounded-xl shadow-lg shadow-brand-accent/20 p-1"
                        referrerPolicy="no-referrer"
                      />
                   ) : (
                      <div className="w-10 h-10 bg-brand-sidebar rounded-xl flex items-center justify-center text-brand-accent font-black italic shadow-lg shadow-brand-sidebar/20">
                         {parts.first ? parts.first[0] : 'A'}
                      </div>
                   )}
                   <div className="flex flex-col">
                      <span className="font-black text-brand-sidebar uppercase italic tracking-tighter leading-none text-lg">
                        {parts.first} <span className="text-brand-accent">{parts.rest}</span>
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1.5">Powered by <span className="text-brand-accent">Rasyatech</span></span>
                   </div>
                  </div>
                  <p className="text-sm text-slate-500 max-w-sm italic leading-relaxed">
                    Menyediakan akses pendidikan yang inklusif dan berkualitas bagi seluruh lapisan masyarakat Indonesia.
                  </p>
                  <div className="flex gap-4 mt-8">
                     <div className="p-2 border border-brand-border rounded hover:text-brand-accent transition-colors"><Instagram className="w-4 h-4" /></div>
                     <div className="p-2 border border-brand-border rounded hover:text-brand-accent transition-colors"><Facebook className="w-4 h-4" /></div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="font-bold text-brand-sidebar uppercase text-xs tracking-widest italic">Hubungi Kami</h4>
                  <div className="flex items-start gap-3 text-xs text-slate-500 font-medium italic">
                     <MapPin className="w-4 h-4 text-brand-accent shrink-0" /> {address}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium italic">
                     <Phone className="w-4 h-4 text-brand-accent shrink-0" /> {phone}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium italic">
                     <Mail className="w-4 h-4 text-brand-accent shrink-0" /> {email}
                  </div>
               </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-brand-sidebar uppercase text-xs tracking-widest italic">Tautan Cepat</h4>
                  <ul className="text-xs text-slate-500 font-bold space-y-2 uppercase leading-none italic">
                     <li><Link to={school ? "/dashboard/ppdb" : "/ppdb"} className="hover:text-brand-accent">PPDB Online</Link></li>
                     <li><Link to="/login" className="hover:text-brand-accent">Cek Sertifikat (Portal)</Link></li>
                     <li><a href="https://wa.me/6285225025555?text=Halo%20Rasyatech,%20saya%20ingin%20bertanya%20mengenai%20layanan%20PKBM." className="hover:text-brand-accent">Bantuan (WhatsApp)</a></li>
                  </ul>
               </div>
            </div>
           );
         })()}
         <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
               <span>© 2026 {schoolName}. All Rights Reserved.</span>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <Activity className="w-3 h-3 text-brand-accent" />
                  <span className="text-[9px] font-black italic tracking-tighter text-slate-600">{visitorCount.toLocaleString()} PENGUNJUNG</span>
               </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
               <span className="text-slate-500">Powered by:</span>
               <span className="text-brand-sidebar font-black italic tracking-tighter text-xs">RASYATECH</span>
            </div>
         </div>
      </footer>

      {/* Floating Consultation Button */}
      <a 
        href="https://wa.me/6285225025555?text=Halo%20Rasyatech,%20saya%20ingin%20konsultasi%20mengenai%20layanan%20PKBM."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-brand-sidebar text-white p-4 rounded-full shadow-2xl shadow-brand-sidebar/40 z-50 hover:scale-110 transition-all group flex items-center gap-3 overflow-hidden"
      >
         <div className="max-w-0 group-hover:max-w-[200px] overflow-hidden transition-all duration-500 whitespace-nowrap">
            <span className="text-xs font-black uppercase tracking-widest italic pr-2">Butuh Konsultasi? (WA)</span>
         </div>
         <MessageCircle className="w-6 h-6 text-brand-accent" />
      </a>
   </div>
);
}
