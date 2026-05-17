import React, { useState, useRef, useEffect } from 'react';
import { Search, UserPlus, Filter, MoreVertical, FileDown, FileUp, Edit2, Trash2, Download, Lock, X, Check, Sparkles, Loader2, CloudUpload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export interface Student {
  id: string;
  name: string;
  nisn: string;
  nipd?: string;
  nik?: string;
  noAkta?: string;
  jk?: string;
  alamat?: string;
  anakKe?: number;
  paket: string;
  kelas?: string;
  status: string;
  noHp?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  agama?: string;
  namaAyah?: string;
  pekerjaanAyah?: string;
  penghasilanAyah?: string;
  namaIbu?: string;
  pekerjaanIbu?: string;
  penghasilanIbu?: string;
  password?: string;
  mustChangePassword?: boolean;
}

const INITIAL_SISWA: Student[] = [
  { 
    id: '1', 
    name: 'Budi Santoso', 
    nisn: '0012345678', 
    paket: 'Paket C', 
    status: 'Aktif', 
    alamat: 'Jl. Melati No. 12', 
    tanggalLahir: '2008-05-12',
    jk: 'Laki-Laki',
    nipd: '2425001',
    password: '12345',
    mustChangePassword: true
  },
];

const MOCK_PPDB_APPLICANTS = [
  { id: 'p1', name: 'Rangga Wijaya', nik: '3201234567890001', paket: 'Paket C', whatsapp: '085211122233', alamat: 'Desa Mekarwangi, Kuningan' },
  { id: 'p2', name: 'Siti Aminah', nik: '3201234567890002', paket: 'Paket B', whatsapp: '085244455566', alamat: 'Kec. Lebakwangi, Kuningan' }
];

import { fetchSpreadsheetData, pushDataToSheet } from '../services/apiService';

import { useSchool } from '../contexts/SchoolContext';

export default function Siswa() {
  const { school } = useSchool();
  const [siswaList, setSiswaList] = useState<Student[]>(() => {
    const saved = localStorage.getItem('school_siswa_list');
    if (saved) return JSON.parse(saved);
    return INITIAL_SISWA;
  });

  const [ppdbQueue, setPpdbQueue] = useState(() => {
    const saved = localStorage.getItem('school_ppdb_queue');
    if (saved) return JSON.parse(saved);
    return MOCK_PPDB_APPLICANTS;
  });

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const autoPushSiswa = async (list: Student[]) => {
    const url = import.meta.env.VITE_APP_URL || '';
    if (!url) return;
    try {
      const header = ["Nama", "NISN", "NIPD", "NIK", "Password", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Agama", "Alamat", "Anak Ke", "Paket", "Status", "No HP", "Nama Ayah", "Pekerjaan Ayah", "Nama Ibu", "Pekerjaan Ibu"];
      const rows = list.map(s => [
        s.name, s.nisn, s.nipd || '', s.nik || '', s.password || '12345', 
        s.jk, s.tempatLahir || '', s.tanggalLahir || '', s.agama || 'Islam', 
        s.alamat || '', s.anakKe || 1, s.paket, s.status, s.noHp || '',
        s.namaAyah || '', s.pekerjaanAyah || '', s.namaIbu || '', s.pekerjaanIbu || ''
      ]);
      await pushDataToSheet(url, 'Siswa', [header, ...rows]);
      console.log("Auto-sync success");
    } catch (e) {
      console.error("Auto-sync error", e);
    }
  };

  useEffect(() => {
    localStorage.setItem('school_siswa_list', JSON.stringify(siswaList));
  }, [siswaList]);

  useEffect(() => {
    localStorage.setItem('school_ppdb_queue', JSON.stringify(ppdbQueue));
  }, [ppdbQueue]);

  const handleSyncSpreadsheet = async () => {
    const url = import.meta.env.VITE_APP_URL || '';
    if (!url) {
      alert("URL Spreadsheet belum diatur di environment variable (VITE_APP_URL).");
      return;
    }

    setLoadingSheet(true);
    try {
      const data = await fetchSpreadsheetData(url);
      if (data.length > 0) {
        setSiswaList(data);
        alert(`Berhasil sinkronisasi ${data.length} data dari spreadsheet.`);
      } else {
        alert("Tidak ada data ditemukan di spreadsheet.");
      }
    } catch (error) {
      alert("Gagal mengambil data. Pastikan URL Apps Script benar dan sudah di-deploy sebagai Web App (Everyon: Anonymous).");
    } finally {
      setLoadingSheet(false);
    }
  };

  const handlePushToSpreadsheet = async () => {
    const url = import.meta.env.VITE_APP_URL || '';
    if (!url) {
      alert("URL Spreadsheet belum diatur di environment variable (VITE_APP_URL).");
      return;
    }

    if (!confirm("Ini akan mengirim seluruh data siswa di platform ini ke Spreadsheet (Overwrite). Lanjutkan?")) return;

    setLoadingSheet(true);
    try {
      // Siapkan data untuk dikirim (Array of Arrays)
      // Baris pertama adalah Header
      const header = ["Nama", "NISN", "NIPD", "NIK", "Password", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Agama", "Alamat", "Anak Ke", "Paket", "Status", "No HP", "Nama Ayah", "Pekerjaan Ayah", "Nama Ibu", "Pekerjaan Ibu"];
      
      const rows = siswaList.map(s => [
        s.name, s.nisn, s.nipd || '', s.nik || '', s.password || '12345', 
        s.jk, s.tempatLahir || '', s.tanggalLahir || '', s.agama || 'Islam', 
        s.alamat || '', s.anakKe || 1, s.paket, s.status, s.noHp || '',
        s.namaAyah || '', s.pekerjaanAyah || '', s.namaIbu || '', s.pekerjaanIbu || ''
      ]);

      await pushDataToSheet(url, 'Siswa', [header, ...rows]);
      alert("Data berhasil dikirim ke Spreadsheet (Database Pusat). Silakan cek Spreadsheet Anda.");
    } catch (error) {
      alert("Gagal mengirim data. Pastikan URL Apps Script benar dan sudah di-deploy sebagai 'Anyone'.");
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('school_siswa_list', JSON.stringify(siswaList));
  }, [siswaList]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPPDBModalOpen, setIsPPDBModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSiswa.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSiswa.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setSiswaList(siswaList.filter(s => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
  };

  const convertPPDBToSiswa = (applicant: any) => {
    if (school?.studentLimit && siswaList.length >= school.studentLimit) {
      alert(`Limit siswa tercapai (${school.studentLimit}). Silakan hubungi pusat untuk upgrade kuota.`);
      return;
    }

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: applicant.name,
      nisn: 'PENDING',
      nik: applicant.nik,
      paket: applicant.paket,
      status: 'Aktif',
      noHp: applicant.whatsapp,
      alamat: applicant.alamat,
      jk: 'Laki-Laki', // Default
      agama: 'Islam', // Default
      anakKe: 1,
      password: '12345',
      mustChangePassword: true
    };
    
    const newList = [...siswaList, newStudent];
    setSiswaList(newList);
    
    // Hapus dari antrean PPDB agar tidak duplikat
    const newQueue = ppdbQueue.filter((a: any) => a.id !== applicant.id);
    setPpdbQueue(newQueue);
    
    setIsPPDBModalOpen(false);
    alert(`${applicant.name} berhasil dipindahkan ke Data Siswa. Password default: 12345`);
    
    // Auto sync ke cloud
    autoPushSiswa(newList);
  };

  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas', { ascending: true });
      if (data) {
        setClasses(data.map(d => ({ id: d.id, name: d.nama_kelas })));
      }
    };
    fetchClasses();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    nipd: '',
    nik: '',
    noAkta: '',
    kelas: '',
    jk: 'Laki-Laki',
    alamat: '',
    anakKe: 1,
    paket: 'Paket C',
    status: 'Aktif',
    noHp: '',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    namaAyah: '',
    pekerjaanAyah: '',
    penghasilanAyah: '0 - 500.000',
    namaIbu: '',
    pekerjaanIbu: '',
    penghasilanIbu: '0 - 500.000'
  });

  const filteredSiswa = siswaList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nisn.includes(searchQuery)
  );

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingSiswa(student);
      setFormData({
        name: student.name,
        nisn: student.nisn,
        nipd: student.nipd || '',
        nik: student.nik || '',
        noAkta: student.noAkta || '',
        kelas: student.kelas || '',
        jk: student.jk || 'Laki-Laki',
        alamat: student.alamat || '',
        anakKe: student.anakKe || 1,
        paket: student.paket,
        status: student.status,
        noHp: student.noHp || '',
        tempatLahir: student.tempatLahir || '',
        tanggalLahir: student.tanggalLahir || '',
        agama: student.agama || 'Islam',
        namaAyah: student.namaAyah || '',
        pekerjaanAyah: student.pekerjaanAyah || '',
        penghasilanAyah: student.penghasilanAyah || '0 - 500.000',
        namaIbu: student.namaIbu || '',
        pekerjaanIbu: student.pekerjaanIbu || '',
        penghasilanIbu: student.penghasilanIbu || '0 - 500.000'
      });
    } else {
      setEditingSiswa(null);
      setFormData({
        name: '',
        nisn: '',
        nipd: '',
        nik: '',
        noAkta: '',
        kelas: '',
        jk: 'Laki-Laki',
        alamat: '',
        anakKe: 1,
        paket: 'Paket C',
        status: 'Aktif',
        noHp: '',
        tempatLahir: '',
        tanggalLahir: '',
        agama: 'Islam',
        namaAyah: '',
        pekerjaanAyah: '',
        penghasilanAyah: '0 - 500.000',
        namaIbu: '',
        pekerjaanIbu: '',
        penghasilanIbu: '0 - 500.000'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSiswa && school?.studentLimit && siswaList.length >= school.studentLimit) {
      alert(`Limit siswa tercapai (${school.studentLimit}). Silakan hubungi pusat untuk upgrade kuota.`);
      return;
    }

    setIsSaving(true);
    try {
      const isAlumniStatus = formData.status === 'Lulus' || formData.status === 'Keluar';

      if (isAlumniStatus) {
        if (confirm(`Apakah Anda yakin ingin memindahkan ${formData.name} ke Database Alumni? Siswa ini akan dihapus dari daftar siswa aktif.`)) {
          const newAlumni = {
            id: editingSiswa ? editingSiswa.id : Math.random().toString(36).substr(2, 9),
            name: formData.name,
            nisn: formData.nisn,
            lulus: new Date().getFullYear().toString(),
            program: formData.paket,
            status: formData.status === 'Lulus' ? 'Alumni - Lulus' : 'Keluar / DO'
          };

          const savedAlumni = localStorage.getItem('school_alumni_list');
          const alumniList = savedAlumni ? JSON.parse(savedAlumni) : [
            { id: '1', name: 'Andri Laksana', nisn: '1234567890', lulus: '2024', program: 'Paket C', status: 'Kuliah - UNY' },
            { id: '2', name: 'Maya Citra', nisn: '1234567891', lulus: '2023', program: 'Paket C', status: 'Bekerja - Admin' },
            { id: '3', name: 'Rudi Tabuti', nisn: '1234567892', lulus: '2023', program: 'Paket B', status: 'Lanjut Paket C' },
            { id: '4', name: 'Sinta Dewi', nisn: '1234567893', lulus: '2022', program: 'Paket C', status: 'Wirausaha' },
          ];
          
          localStorage.setItem('school_alumni_list', JSON.stringify([...alumniList, newAlumni]));
          
          const newList = siswaList.filter(s => s.id !== editingSiswa.id);
          if (editingSiswa) {
            setSiswaList(newList);
          }
          
          alert(`Siswa ${formData.name} berhasil dipindahkan ke Database Alumni.`);
          setIsModalOpen(false);
          await autoPushSiswa(newList);
          return;
        }
      }

      if (editingSiswa) {
        const newList = siswaList.map(s => s.id === editingSiswa.id ? { ...s, ...formData } : s);
        setSiswaList(newList);
        await autoPushSiswa(newList);
      } else {
        const newSiswa: Student = {
          id: Math.random().toString(36).substr(2, 9),
          ...formData,
          password: '12345',
          mustChangePassword: true
        };
        const newList = [...siswaList, newSiswa];
        setSiswaList(newList);
        await autoPushSiswa(newList);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = (id: string) => {
    const student = siswaList.find(s => s.id === id);
    if (!student) return;
    setSiswaList(siswaList.map(s => s.id === id ? { ...s, password: '12345', mustChangePassword: true } : s));
    alert('Kata sandi berhasil direset ke 12345');
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      const newList = siswaList.filter(s => s.id !== id);
      setSiswaList(newList);
      autoPushSiswa(newList);
    }
  };

  const downloadTemplate = () => {
    const data = [
      ["Nama", "NISN", "NIPD", "NIK", "No Akta", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Agama", "Alamat", "Anak Ke", "Program", "Status", "No HP", "Nama Ayah", "Pekerjaan Ayah", "Nama Ibu", "Pekerjaan Ibu"],
      ["Budi Santoso", "0012345678", "2425001", "3201234567890001", "12345", "Laki-Laki", "Kuningan", "2008-05-12", "Islam", "Jl. Contoh No. 1", "1", "Paket C", "Aktif", "08123456789", "Suryono", "Buruh", "Siti", "IRT"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "template_import_siswa_lengkap.xlsx");
  };

  const exportData = () => {
    const data = filteredSiswa.map(s => ({
      Nama: s.name,
      NISN: s.nisn,
      NIPD: s.nipd || '',
      NIK: s.nik || '',
      "No Akta": s.noAkta || '',
      "Jenis Kelamin": s.jk || '',
      "Tempat Lahir": s.tempatLahir || '',
      "Tanggal Lahir": s.tanggalLahir || '',
      Agama: s.agama || '',
      Alamat: s.alamat || '',
      "Anak Ke": s.anakKe || '',
      Program: s.paket,
      Status: s.status,
      "No HP": s.noHp || '',
      "Nama Ayah": s.namaAyah || '',
      "Pekerjaan Ayah": s.pekerjaanAyah || '',
      "Nama Ibu": s.namaIbu || '',
      "Pekerjaan Ibu": s.pekerjaanIbu || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Siswa");
    XLSX.writeFile(wb, "data_siswa_export.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      if (school?.studentLimit && (siswaList.length + data.length) > school.studentLimit) {
        alert(`Gagal import. Total siswa akan melebihi limit (${school.studentLimit}). Sisa kuota: ${school.studentLimit - siswaList.length}`);
        return;
      }

      const importedSiswa: Student[] = data.map((item, index) => ({
        id: `imported-${Date.now()}-${index}`,
        name: item.Nama || item.name || '',
        nisn: String(item.NISN || item.nisn || ''),
        nipd: String(item.NIPD || item.nipd || ''),
        nik: String(item.NIK || item.nik || ''),
        noAkta: String(item["No Akta"] || item.noAkta || ''),
        jk: item["Jenis Kelamin"] || item.jk || 'Laki-Laki',
        tempatLahir: item["Tempat Lahir"] || item.tempatLahir || '',
        tanggalLahir: item["Tanggal Lahir"] || item.tanggalLahir || '',
        agama: item.Agama || item.agama || 'Islam',
        alamat: item.Alamat || item.alamat || '',
        anakKe: parseInt(item["Anak Ke"] || item.anakKe) || 1,
        paket: item.Program || item.paket || 'Paket C',
        status: item.Status || item.status || 'Aktif',
        noHp: String(item["No HP"] || item.noHp || ''),
        namaAyah: item["Nama Ayah"] || item.namaAyah || '',
        pekerjaanAyah: item["Pekerjaan Ayah"] || item.pekerjaanAyah || '',
        namaIbu: item["Nama Ibu"] || item.namaIbu || '',
        pekerjaanIbu: item["Pekerjaan Ibu"] || item.pekerjaanIbu || '',
        password: '12345',
        mustChangePassword: true
      }));

      const newList = [...siswaList, ...importedSiswa];
      setSiswaList(newList);
      alert(`${importedSiswa.length} data siswa berhasil diimport.`);
      autoPushSiswa(newList);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl">
       <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        className="hidden" 
        accept=".xlsx, .xls"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main">Data Siswa</h2>
          <p className="text-xs text-brand-text-muted">Total {siswaList.length} Siswa Terdaftar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Terpilih ({selectedIds.size})
            </button>
          )}
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-brand-bg border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all italic"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <FileUp className="w-3.5 h-3.5" />
            Import
          </button>
          <button 
            onClick={exportData}
            className="flex items-center gap-2 bg-white border border-brand-border text-brand-text-main px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export
          </button>
          <button 
            onClick={() => setIsPPDBModalOpen(true)}
            className="flex items-center gap-2 bg-brand-sidebar text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-sidebar/90 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Antrean PPDB
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent/90 transition-all shadow-sm shadow-brand-accent/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tambah Siswa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-brand-border flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-brand-border flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau NISN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full focus:ring-0" 
            />
          </div>
          <button className="p-2 border border-brand-border rounded-lg bg-white hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 border-b border-brand-border w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredSiswa.length && filteredSiswa.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent"
                  />
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border">Nama Lengkap</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border">NISN</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border text-center">Program</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSiswa.map((s) => (
                <tr key={s.id} className={cn(
                  "group hover:bg-slate-50/50 transition-colors text-xs font-medium",
                  selectedIds.has(s.id) && "bg-brand-accent/5"
                )}>
                  <td className="px-6 py-3.5 border-b border-brand-border">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent"
                    />
                  </td>
                  <td className="px-6 py-3.5 border-b border-brand-border">
                    <div className="font-bold text-brand-text-main">{s.name}</div>
                  </td>
                  <td className="px-6 py-3.5 border-b border-brand-border text-slate-500 italic">{s.nisn}</td>
                  <td className="px-6 py-3.5 border-b border-brand-border text-center">
                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase italic">
                      {s.paket}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 border-b border-brand-border">
                    <div className={`text-[10px] font-bold flex items-center gap-1.5 ${s.status === 'Aktif' ? 'text-emerald-600' : 'text-orange-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${s.status === 'Aktif' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                      {s.status}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 border-b border-brand-border text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => handleOpenModal(s)}
                        className="p-1.5 bg-white border border-brand-border rounded-md transition-all text-slate-400 hover:text-brand-accent shadow-sm" 
                        title="Edit Data"
                      >
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         className="p-1.5 bg-white border border-brand-border rounded-md transition-all text-slate-400 hover:text-brand-accent shadow-sm" 
                         title="Reset Kata Sandi"
                         onClick={() => handleResetPassword(s.id)}
                       >
                         <Lock className="w-3.5 h-3.5" />
                       </button>
                       <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 bg-white border border-brand-border rounded-md transition-all text-slate-400 hover:text-red-500 shadow-sm" 
                        title="Hapus Data"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50/50 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider italic">
           <span>Menampilkan 1-{filteredSiswa.length} dari {siswaList.length}</span>
           <div className="flex gap-2">
             <button className="px-3 py-1.5 border border-brand-border rounded-lg bg-white hover:bg-slate-50 transition-all font-bold">Sebelumnya</button>
             <button className="px-3 py-1.5 border border-brand-border rounded-lg bg-white hover:bg-slate-50 transition-all font-bold">Selanjutnya</button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-sidebar/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-brand-border flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-white sticky top-0 z-20">
                <div>
                  <h3 className="text-lg font-black text-brand-sidebar uppercase italic tracking-widest">
                    {editingSiswa ? 'Edit' : 'Tambah'} <span className="text-brand-accent">Siswa</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Biodata Lengkap Peserta Didik</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form id="student-form" onSubmit={handleSave} className="space-y-6">
                  {/* Identitas Siswa */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-brand-border space-y-4">
                    <h4 className="text-[10px] font-black text-brand-sidebar uppercase tracking-[0.2em] italic mb-2 border-b border-brand-border pb-2">1. Identitas Siswa</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nama Lengkap Sesuai Ijazah</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">NISN (10 Digit)</label>
                        <input type="text" required value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">NIPD</label>
                        <input type="text" value={formData.nipd} onChange={(e) => setFormData({...formData, nipd: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">NIK (KTP/KK)</label>
                        <input type="text" value={formData.nik} onChange={(e) => setFormData({...formData, nik: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">No Akta Lahir</label>
                        <input type="text" value={formData.noAkta} onChange={(e) => setFormData({...formData, noAkta: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Jenis Kelamin</label>
                        <select value={formData.jk} onChange={(e) => setFormData({...formData, jk: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="Laki-Laki">Laki-Laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Agama</label>
                        <select value={formData.agama} onChange={(e) => setFormData({...formData, agama: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Budha">Budha</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Anak Ke</label>
                        <input type="number" value={formData.anakKe} onChange={(e) => setFormData({...formData, anakKe: parseInt(e.target.value) || 1})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tempat Lahir</label>
                        <input type="text" value={formData.tempatLahir} onChange={(e) => setFormData({...formData, tempatLahir: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tanggal Lahir</label>
                        <input type="date" value={formData.tanggalLahir} onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Akademik & Kontak */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-brand-border space-y-4">
                    <h4 className="text-[10px] font-black text-brand-sidebar uppercase tracking-[0.2em] italic mb-2 border-b border-brand-border pb-2">2. Akademik & Kontak</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Program Paket</label>
                        <select value={formData.paket} onChange={(e) => setFormData({...formData, paket: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="Paket A">Paket A</option>
                          <option value="Paket B">Paket B</option>
                          <option value="Paket C">Paket C</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Kelas</label>
                        <select value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="">-- Tanpa Kelas --</option>
                          {classes
                            .filter(c => {
                              const name = c.name.toLowerCase();
                              if (formData.paket === 'Paket B') {
                                return name.includes('7') || name.includes('8') || name.includes('9') || name.includes('paket b');
                              }
                              if (formData.paket === 'Paket C') {
                                return name.includes('10') || name.includes('11') || name.includes('12') || name.includes('paket c');
                              }
                              return true;
                            })
                            .map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Status Siswa</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="Aktif">Aktif</option>
                          <option value="Cuti">Cuti</option>
                          <option value="Lulus">Lulus</option>
                          <option value="Keluar">Keluar</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">No HP / WhatsApp Siswa</label>
                        <input type="text" value={formData.noHp} onChange={(e) => setFormData({...formData, noHp: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Pas Foto (Tautan/ID)</label>
                        <input type="text" placeholder="G01.jpg" className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all italic opacity-50" disabled />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Alamat Lengkap</label>
                      <textarea value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all h-20 resize-none" />
                    </div>
                  </div>

                  {/* Data Orang Tua */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-brand-border space-y-6">
                    <h4 className="text-[10px] font-black text-brand-sidebar uppercase tracking-[0.2em] italic mb-2 border-b border-brand-border pb-2">3. Data Orang Tua / Wali</h4>
                    
                    <div className="space-y-4">
                      <h5 className="text-[9px] font-black text-brand-accent uppercase tracking-widest italic flex items-center gap-2">Ayah Kandung <div className="h-[1px] bg-brand-border flex-1" /></h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nama Ayah</label>
                          <input type="text" value={formData.namaAyah} onChange={(e) => setFormData({...formData, namaAyah: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Pekerjaan Ayah</label>
                          <input type="text" value={formData.pekerjaanAyah} onChange={(e) => setFormData({...formData, pekerjaanAyah: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Penghasilan Ayah Per Bulan</label>
                        <select value={formData.penghasilanAyah} onChange={(e) => setFormData({...formData, penghasilanAyah: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="0 - 500.000">Rp 0 - Rp 500.000</option>
                          <option value="500.000 - 1.000.000">Rp 500.000 - Rp 1.000.000</option>
                          <option value="1.000.000 - 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                          <option value="2.000.000 - 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                          <option value="> 5.000.000">&gt; Rp 5.000.000</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[9px] font-black text-brand-accent uppercase tracking-widest italic flex items-center gap-2">Ibu Kandung <div className="h-[1px] bg-brand-border flex-1" /></h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nama Ibu</label>
                          <input type="text" value={formData.namaIbu} onChange={(e) => setFormData({...formData, namaIbu: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Pekerjaan Ibu</label>
                          <input type="text" value={formData.pekerjaanIbu} onChange={(e) => setFormData({...formData, pekerjaanIbu: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Penghasilan Ibu Per Bulan</label>
                        <select value={formData.penghasilanIbu} onChange={(e) => setFormData({...formData, penghasilanIbu: e.target.value})} className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-bold text-brand-sidebar outline-none focus:border-brand-accent transition-all">
                          <option value="0 - 500.000">Rp 0 - Rp 500.000</option>
                          <option value="500.000 - 1.000.000">Rp 500.000 - Rp 1.000.000</option>
                          <option value="1.000.000 - 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                          <option value="2.000.000 - 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                          <option value="> 5.000.000">&gt; Rp 5.000.000</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-brand-border bg-white flex gap-3">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-brand-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  form="student-form"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-brand-sidebar text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-sidebar/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPPDBModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPPDBModalOpen(false)}
              className="absolute inset-0 bg-brand-sidebar/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-brand-border"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-black text-brand-sidebar uppercase italic tracking-widest">Antrean <span className="text-brand-accent">PPDB</span></h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Calon Siswa yang sudah mengisi formulir</p>
                  </div>
                  <button onClick={() => setIsPPDBModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                 <div className="space-y-3">
                  {ppdbQueue.map((applicant: any) => (
                    <div key={applicant.id} className="p-4 bg-slate-50 border border-brand-border rounded-2xl flex items-center justify-between group transition-all hover:bg-white hover:shadow-md">
                      <div>
                        <p className="text-xs font-black text-brand-sidebar uppercase italic">{applicant.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{applicant.paket} • NIK: {applicant.nik}</p>
                      </div>
                      <button 
                        onClick={() => convertPPDBToSiswa(applicant)}
                        className="bg-brand-accent text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-accent/20"
                      >
                         <Check className="w-3 h-3" /> Terima
                      </button>
                    </div>
                  ))}
                  
                  {ppdbQueue.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs italic text-slate-400 font-bold uppercase">Belum ada antrean masuk</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

