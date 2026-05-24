/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Outlet, Navigate, useLocation } from 'react-router-dom';
import { SchoolProvider, useSchool } from './contexts/SchoolContext';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import AutoLogout from './components/AutoLogout';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DataSiswa from './pages/DataSiswa';
import BankSoal from './pages/BankSoal';
import ButirSoal from './pages/ButirSoal';
import HasilUjian from './pages/HasilUjian';
import Guru from './pages/Guru';
import MataPelajaran from './pages/MataPelajaran';
import DeteksiObjek from './pages/DeteksiObjek';
import UjianSiswa from './pages/UjianSiswa';
import Akademik from './pages/Akademik';
import Alumni from './pages/Alumni';
import Materi from './pages/Materi';
import Ujian from './pages/Ujian';
import Nilai from './pages/Nilai';
import Raport from './pages/Raport';
import Kelas from './pages/Kelas';
import KenaikanKelas from './pages/KenaikanKelas';
import SKL from './pages/SKL';
import PPDB from './pages/PPDB';
import PPDBRegistration from './pages/PPDBRegistration';
import PendingActivation from './pages/PendingActivation';
import RegisterSchool from './pages/RegisterSchool';
import RegisterUser from './pages/RegisterUser';
import Pengumuman from './pages/Pengumuman';
import Site from './pages/Site';
import Statistik from './pages/Statistik';
import Aset from './pages/Aset';
import Relasi from './pages/Relasi';
import Keuangan from './pages/Keuangan';
import Tagihan from './pages/Tagihan';
import Diskusi from './pages/Diskusi';
import AiAsisten from './pages/AiAsisten';
import Purchase from './pages/Purchase';
import Feedback from './pages/Feedback';
import Analitik from './pages/Analitik';
import Settings from './pages/Settings';
import ModulKesetaraan from './pages/ModulKesetaraan';
import Akreditasi from './pages/Akreditasi';
import ProfileGuru from './pages/ProfileGuru';
import Presensi from './pages/Presensi';
import AgendaGuru from './pages/AgendaGuru';
import PresensiSiswa from './pages/PresensiSiswa';
import AffiliateDashboard from './pages/AffiliateDashboard';
import { toast, Toaster } from 'sonner';

function GuestGuard({ children }: { children: React.ReactNode }) {
  const role = localStorage.getItem('userRole');
  const location = useLocation();
  const allowedPaths = [
    '/dashboard/diskusi', 
    '/dashboard/settings', 
    '/dashboard/feedback', 
    '/dashboard/profile'
  ];

  useEffect(() => {
    if (role === 'Tamu') {
      const isDashboardRoot = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/dashboard/');
      const isAllowed = allowedPaths.some(path => location.pathname.includes(path)) || isDashboardRoot;
      
      if (!isAllowed) {
        toast.error('Akses Terbatas: Login sebagai Tamu');
      }
    }
  }, [location.pathname, role]);

  if (role === 'Tamu') {
    const isDashboardRoot = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/dashboard/');
    const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path)) || isDashboardRoot;
    
    if (!isAllowed) {
      return <Navigate to="/dashboard/diskusi" replace />;
    }
  }

  return <>{children}</>;
}

function SchoolLoader() {
  const { schoolSlug } = useParams();
  const { setSchoolBySlug, school, loading, error } = useSchool();

  useEffect(() => {
    if (schoolSlug) {
      setSchoolBySlug(schoolSlug);
    }
  }, [schoolSlug, setSchoolBySlug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-brand-sidebar rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Memuat Institusi...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 flex-col gap-6 p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
        <div className="text-4xl font-black text-red-500 italic uppercase">404</div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-brand-sidebar italic uppercase leading-tight">Sekolah <span className="text-red-500">Tidak Ditemukan</span></h2>
        <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] max-w-xs mx-auto">Kami tidak dapat menemukan institusi dengan alamat: <span className="text-brand-sidebar underline italic">{schoolSlug}</span></p>
      </div>
      <a href="/" className="bg-brand-sidebar text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-sidebar/20 hover:scale-105 active:scale-95 transition-all italic">Kembali ke Beranda</a>
    </div>
  );

  if (!school && !loading && !error) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Portal Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Sekolah atau institusi yang anda cari belum terdaftar atau portal sedang dalam proses setup.</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 italic">Silakan hubungi tim dukungan Rasyatech.</p>
      </div>
    </div>
  );

  return <Outlet />;
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Coming Soon</h2>
      <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">
        Halaman ini masih dalam tahap pengembangan. Silakan kembali lagi nanti.
      </p>
    </div>
  );
}

function AppContent() {
  const { school, loading, isBlocked, isMasterDomain } = useSchool();
  const location = useLocation();
  const isSubroutePath = location.pathname.startsWith('/s/') || location.pathname.startsWith('/dashboard');
  const isPpdbPath = location.pathname === '/ppdb' || location.pathname.startsWith('/ppdb/');

  if (isBlocked && !isPpdbPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-slate-800 font-sans p-6 text-center">
        <div className="max-w-md w-full border border-red-100 bg-white rounded-3xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-black italic text-red-600">403</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Layanan Nonaktif</h1>
          <p className="font-bold text-red-600 text-xs mt-1 uppercase tracking-wide">Lembaga Belum Terverifikasi atau Sudah Dihapus</p>
          <p className="text-xs text-slate-500 leading-relaxed mt-4">
            Portal ini tidak lagi aktif atau pendaftarannya telah dicabut atau dinonaktifkan secara permanen oleh Superadmin Rasyatech.
          </p>
          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Rasyatech Digital Systems</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show full page loader on initial mount if we are not on a subroute 
  // and we haven't determined if it's a master domain yet
  if (loading && !isSubroutePath && !isMasterDomain && !isPpdbPath) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-brand-sidebar rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Menghubungkan Institusi...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root Path - Portal Web */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/preview" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Login />} />
      <Route path="/ujian/:id" element={<UjianSiswa />} />
      <Route path="/purchase" element={<Purchase />} />
      <Route path="/affiliate" element={<AffiliateDashboard />} />
      <Route path="/pending-activation" element={<PendingActivation />} />
      <Route path="/register-school" element={<RegisterSchool />} />
      <Route path="/register-user" element={<RegisterUser />} />
      <Route path="/ppdb" element={<PPDBRegistration />} />
      <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/students" element={<Navigate to="/dashboard/data-siswa" replace />} />
      <Route path="/teachers" element={<Navigate to="/dashboard/data-guru" replace />} />
      
      {/* Portal Dashboard Routes - Shared by all domains */}
      <Route path="/dashboard" element={<GuestGuard><Layout /></GuestGuard>}>
         <Route index element={<Dashboard />} />
         <Route path="modul" element={<ModulKesetaraan />} />
         <Route path="akreditasi" element={<Akreditasi />} />
         <Route path="course/:id" element={<CourseDetail />} />
         <Route path="data-siswa" element={<DataSiswa />} />
         <Route path="soal" element={<BankSoal />} />
         <Route path="soal/:id/detail" element={<ButirSoal />} />
         <Route path="hasil-ujian" element={<HasilUjian />} />
         <Route path="data-guru" element={<Guru />} />
         <Route path="mata-pelajaran" element={<MataPelajaran />} />
         <Route path="akademik" element={<Akademik />} />
         <Route path="presensi" element={<PresensiWrapper />} />
         <Route path="agenda" element={<AgendaGuru />} />
         <Route path="relasi" element={<Relasi />} />
         <Route path="alumni" element={<Alumni />} />
         <Route path="materi" element={<Materi />} />
         <Route path="ujian" element={<Ujian />} />
         <Route path="nilai" element={<Nilai />} />
         <Route path="raport" element={<Raport />} />
         <Route path="kelas" element={<Kelas />} />
         <Route path="kenaikan" element={<KenaikanKelas />} />
         <Route path="skl" element={<SKL />} />
         <Route path="ppdb" element={<PPDB />} />
         <Route path="pengumuman" element={<Pengumuman />} />
         <Route path="site" element={<Site />} />
         <Route path="statistik" element={<Statistik />} />
         <Route path="aset" element={<Aset />} />
         <Route path="keuangan" element={<Keuangan />} />
         <Route path="tagihan" element={<Tagihan />} />
         <Route path="analitik" element={<Analitik />} />
         <Route path="diskusi" element={<Diskusi />} />
         <Route path="ai-asisten" element={<AiAsisten />} />
         <Route path="feedback" element={<Feedback />} />
         <Route path="settings" element={<Settings />} />
         <Route path="profile" element={<ProfileGuru />} />
         <Route path="*" element={<ComingSoon />} />
      </Route>

      <Route path="/s/:schoolSlug" element={<SchoolLoader />}>
         <Route index element={<LandingPage />} />
         <Route path="login" element={<Login />} />
         <Route path="ujian/:id" element={<UjianSiswa />} />
         <Route path="dashboard" element={<GuestGuard><Layout /></GuestGuard>}>
            <Route index element={<Dashboard />} />
            <Route path="modul" element={<ModulKesetaraan />} />
            <Route path="akreditasi" element={<Akreditasi />} />
            <Route path="course/:id" element={<CourseDetail />} />
            <Route path="students" element={<DataSiswa />} />
          <Route path="teachers" element={<Guru />} />
          <Route path="students" element={<DataSiswa />} />
          <Route path="teachers" element={<Guru />} />
          <Route path="teachers" element={<Guru />} />
          <Route path="students" element={<DataSiswa />} />
          <Route path="teachers" element={<Guru />} />
          <Route path="data-siswa" element={<DataSiswa />} />
            <Route path="soal" element={<BankSoal />} />
            <Route path="soal/:id/detail" element={<ButirSoal />} />
            <Route path="hasil-ujian" element={<HasilUjian />} />
            <Route path="data-guru" element={<Guru />} />
            <Route path="mata-pelajaran" element={<MataPelajaran />} />
            <Route path="akademik" element={<Akademik />} />
            <Route path="presensi" element={<PresensiWrapper />} />
            <Route path="agenda" element={<AgendaGuru />} />
            <Route path="relasi" element={<Relasi />} />
            <Route path="alumni" element={<Alumni />} />
            <Route path="materi" element={<Materi />} />
            <Route path="ujian" element={<Ujian />} />
            <Route path="nilai" element={<Nilai />} />
            <Route path="raport" element={<Raport />} />
            <Route path="kelas" element={<Kelas />} />
            <Route path="kenaikan" element={<KenaikanKelas />} />
            <Route path="skl" element={<SKL />} />
            <Route path="ppdb" element={<PPDB />} />
            <Route path="pengumuman" element={<Pengumuman />} />
            <Route path="site" element={<Site />} />
            <Route path="statistik" element={<Statistik />} />
            <Route path="aset" element={<Aset />} />
            <Route path="keuangan" element={<Keuangan />} />
            <Route path="tagihan" element={<Tagihan />} />
            <Route path="analitik" element={<Analitik />} />
            <Route path="diskusi" element={<Diskusi />} />
            <Route path="ai-asisten" element={<AiAsisten />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<ProfileGuru />} />
         </Route>
      </Route>

      <Route path="*" element={<ComingSoon />} />
    </Routes>
  );
}

function PresensiWrapper() {
  const role = localStorage.getItem('userRole') || 'Siswa';
  return role === 'Siswa' ? <PresensiSiswa /> : <Presensi />;
}

function ReferralTracker() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('rasya_ref', ref);
    }
  }, [location]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <SchoolProvider>
        <AutoLogout />
        <ReferralTracker />
        <AppContent />
      </SchoolProvider>
    </BrowserRouter>
  );
}
