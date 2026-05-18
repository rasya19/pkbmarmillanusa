import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Zap,
  MessageCircle,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const { school, loading, isMasterDomain } = useSchool();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-sidebar border-t-brand-accent rounded-full animate-spin" />
          <p className="font-black text-brand-sidebar italic uppercase tracking-widest text-[10px]">Memuat Sistem...</p>
        </div>
      </div>
    );
  }

  const schoolName = school?.name || 'PKBM ARMILLA NUSA';
  const parts = school?.name 
    ? { first: school.name.split(' ')[0], rest: school.name.split(' ').slice(1).join(' ') }
    : { first: 'PKBM', rest: 'ARMILLA NUSA' };

  const accreditation = school?.accreditation || 'TERREDITASI B';
  const npsn = school?.npsn || 'P9997973';
  const address = school?.address || 'Jl. Raya No. 123, Indonesia';
  const phone = school?.whatsapp || '+62 852-2502-5555';
  const email = school?.adminEmail || 'admin@armillanusa.com';

  const navLinks = [
    { name: 'Tentang Kami', href: '#tentang-kami' },
    { name: 'Fasilitas', href: '#fasilitas' },
    { name: 'Program', href: '#program' },
    { name: 'Kontak', href: '#kontak' },
  ];

  const heroHeadline = !isMasterDomain ? (localStorage.getItem('school_hero_headline') || 'MEMBANGUN MASA DEPAN TANPA BATAS.') : 'DIGITAL EDUCATION PLATFORM.';
  const heroSub = !isMasterDomain ? (localStorage.getItem('school_hero_sub') || 'Pusat Kegiatan Belajar Masyarakat (PKBM) yang mengutamakan kualitas, fleksibilitas, dan kemajuan teknologi untuk mencerdaskan bangsa Indonesia.') : 'Sistem manajemen pendidikan terintegrasi untuk sekolah, PKBM, dan lembaga pendidikan modern.';

  return (
    <div className="bg-white font-sans selection:bg-brand-accent selection:text-white scroll-smooth relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-brand-border z-[100] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
             {school?.logoUrl ? (
                <img 
                  src={school.logoUrl} 
                  alt={schoolName} 
                  className="w-11 h-11 object-contain bg-white rounded-xl shadow-lg shadow-brand-accent/20 p-1 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
             ) : (
                <div className="w-11 h-11 bg-brand-sidebar rounded-xl flex items-center justify-center text-brand-accent font-black italic shadow-lg shadow-brand-sidebar/20 group-hover:scale-105 transition-transform">
                   {parts.first ? parts.first[0] : 'P'}
                </div>
             )}
             <div className="flex flex-col">
                <span className="font-black text-brand-sidebar uppercase italic tracking-tighter leading-none text-xl">
                  {parts.first} <span className="text-brand-accent">{parts.rest}</span>
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">
                  Powered by Rasyatech
                </span>
             </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-[11px] font-bold text-slate-500 hover:text-brand-accent transition-colors uppercase tracking-widest"
              >
                {link.name}
              </a>
            ))}
            <Link to="/login" className="bg-brand-sidebar text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent hover:scale-105 transition-all shadow-xl shadow-brand-sidebar/20 italic">
              Portal Masuk
            </Link>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-brand-sidebar hover:bg-slate-100 rounded-xl transition-all"
          >
            {isMenuOpen ? <Zap className="w-6 h-6 rotate-45 text-brand-accent" /> : <MenuIcon />}
          </button>
        </div>

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
      <header className="pt-48 pb-24 px-6 relative overflow-hidden bg-slate-50">
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
                 {`TERAKREDITASI ${accreditation}`}
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-brand-sidebar leading-[0.85] tracking-tighter italic mb-10 group whitespace-pre-line">
                <span className="text-brand-sidebar group-hover:text-brand-accent transition-colors duration-500">
                  {heroHeadline}
                </span>
              </h1>
              <p className="text-xl text-slate-500 font-medium italic mb-12 max-w-xl leading-relaxed">
                {heroSub}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
                 <Link to="/login" className="bg-brand-sidebar text-white p-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-sidebar/20 flex flex-col items-center justify-center gap-3 group/btn hover:scale-105 transition-all italic border border-white/10">
                    <ShieldCheck className="w-6 h-6 text-brand-accent" />
                    <span>PORTAL ADMIN</span>
                 </Link>
                 <Link to="/login" className="bg-brand-sidebar text-white p-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-sidebar/20 flex flex-col items-center justify-center gap-3 group/btn hover:scale-105 transition-all italic border border-white/10">
                    <Users className="w-6 h-6 text-brand-accent" />
                    <span>PORTAL GURU</span>
                 </Link>
                 <Link to="/login" className="bg-brand-accent text-white p-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-accent/20 flex flex-col items-center justify-center gap-3 group/btn hover:scale-105 transition-all italic border border-white/10">
                    <BookOpen className="w-6 h-6 text-brand-sidebar" />
                    <span>PORTAL SISWA</span>
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
                     <p className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2">{schoolName}</p>
                     <p className="text-[10px] text-brand-accent font-black uppercase tracking-[0.3em] bg-white/10 backdrop-blur-md self-start px-4 py-2 rounded-full border border-white/20">
                      NPSN: {npsn} • DATA TERVERIFIKASI
                     </p>
                  </div>
              </div>
           </motion.div>
        </div>
      </header>

      {/* About Section */}
      <section id="tentang-kami" className="py-32 px-6 bg-brand-sidebar text-white relative overflow-hidden">
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
                 <p className="text-slate-400 font-medium italic leading-relaxed">
                   Dengan dukungan teknologi dari Rasyatech Cloud, kami menghadirkan Learning Management System (LMS) modern yang memudahkan proses belajar mengajar secara hibrida maupun penuh daring.
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center py-12 border-y border-white/10">
              {[
                { label: 'Peserta Didik', value: '2.5k+' },
                { label: 'Guru & Staf', value: '45+' },
                { label: 'Alumni Terdata', value: '1.2k+' },
                { label: 'Modul Digital', value: '500+' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl md:text-7xl font-black tracking-tighter text-brand-accent mb-2 italic leading-none">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section id="fasilitas" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h3 className="text-brand-accent font-black uppercase tracking-[0.4em] text-xs mb-6 text-center">Fasilitas Unggulan</h3>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.9] text-center text-brand-sidebar">
              Lingkungan Belajar <span className="text-brand-accent">Modern.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Laboratorium Komputer', img: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&auto=format&fit=crop' },
              { name: 'Ruang Kelas Nyaman', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop' },
              { name: 'Perpustakaan Digital', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop' },
              { name: 'Smart LMS Platform', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop' },
            ].map((f, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-[2.5rem] bg-brand-sidebar shadow-lg">
                <img src={f.img} alt={f.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-sidebar/80 to-transparent flex flex-col justify-end p-8 text-center">
                  <span className="text-white font-black italic text-lg uppercase leading-none tracking-tighter">{f.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section id="program" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-24">
            <h2 className="text-5xl font-black text-brand-sidebar italic uppercase tracking-tighter">Program <span className="text-brand-accent">Pendidikan</span></h2>
            <div className="w-32 h-2 bg-brand-accent mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Kesetaraan A, B, C', desc: 'Layanan pendidikan non-formal setara SD, SMP, dan SMA untuk semua tingkatan usia.', icon: BookOpen },
              { title: 'Vokasi Digital', desc: 'Pengembangan keterampilan komputer, desain, dan literasi digital masa kini.', icon: Zap },
              { title: 'Kurikulum Merdeka', desc: 'Implementasi pembelajaran yang adaptif dan berpusat pada minat peserta didik.', icon: GraduationCap },
            ].map((p, i) => (
              <div key={i} className="p-12 bg-white rounded-[3rem] border border-brand-border hover:border-brand-accent transition-all shadow-sm hover:shadow-2xl relative overflow-hidden group">
                <div className="p-4 bg-brand-bg rounded-2xl w-fit mx-auto mb-10 group-hover:scale-110 transition-transform">
                  <p.icon className="w-10 h-10 text-brand-accent" />
                </div>
                <h3 className="text-2xl font-black text-brand-sidebar italic mb-6 uppercase tracking-tighter">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed italic">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-slate-50 border-t border-brand-border py-20 px-6">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-sidebar rounded-xl flex items-center justify-center text-brand-accent font-black italic">
                     {parts.first ? parts.first[0] : 'A'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-brand-sidebar uppercase italic tracking-tighter text-lg">
                      {parts.first} <span className="text-brand-accent">{parts.rest}</span>
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Powered by Rasyatech</span>
                  </div>
               </div>
               <p className="text-sm text-slate-500 max-w-sm italic leading-relaxed">
                 Berkomitmen memberikan layanan pendidikan terbaik dengan standar kualitas yang terakreditasi dan berbasis teknologi.
               </p>
               <div className="flex gap-4 mt-8">
                  <Instagram className="w-5 h-5 text-slate-400 hover:text-brand-accent transition-colors" />
                  <Facebook className="w-5 h-5 text-slate-400 hover:text-brand-accent transition-colors" />
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="font-bold text-brand-sidebar uppercase text-xs tracking-widest italic">Hubungi Kami</h4>
               <div className="flex items-start gap-3 text-[10px] text-slate-500 italic">
                  <MapPin className="w-4 h-4 text-brand-accent shrink-0" /> {address}
               </div>
               <div className="flex items-center gap-3 text-[10px] text-slate-500 italic">
                  <Phone className="w-4 h-4 text-brand-accent shrink-0" /> {phone}
               </div>
               <div className="flex items-center gap-3 text-[10px] text-slate-500 italic">
                  <Mail className="w-4 h-4 text-brand-accent shrink-0" /> {email}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="font-bold text-brand-sidebar uppercase text-xs tracking-widest italic">Link Cepat</h4>
               <ul className="text-[10px] text-slate-500 font-bold space-y-2 uppercase italic">
                  <li><Link to="/login" className="hover:text-brand-accent">Portal Login</Link></li>
                  <li><a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} className="hover:text-brand-accent">Layanan Pengaduan</a></li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>© 2026 {schoolName}. All Rights Reserved.</span>
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
               <span className="text-slate-500">Infrastructure by:</span>
               <span className="text-brand-sidebar font-black italic tracking-tighter text-xs">RASYATECH</span>
            </div>
         </div>
      </footer>

      {/* Floating Action Button */}
      <a 
        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-brand-sidebar text-white p-4 rounded-full shadow-2xl z-50 hover:scale-110 transition-all flex items-center gap-2 group"
      >
         <MessageCircle className="w-6 h-6 text-brand-accent" />
         <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-xs uppercase tracking-widest italic whitespace-nowrap">Hubungi Kami</span>
      </a>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );
}
