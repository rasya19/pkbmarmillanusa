import React, { useState, useEffect } from 'react';
import { Globe, Layout as LayoutIcon, Image as ImageIcon, MessageSquare, Settings, ExternalLink, Eye, MousePointer2, Plus, Trash2, Edit3, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';

interface Berita {
  id: string;
  title: string;
  date: string;
  category: string;
  img: string;
  source?: string;
  content?: string;
}

export default function Site() {
  const { school } = useSchool();
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  
  const [identityForm, setIdentityForm] = useState({
    name: school?.name || '',
    npsn: school?.npsn || '',
    accreditation: school?.accreditation || 'Belum Terakreditasi',
    address: school?.address || '',
    whatsapp: school?.whatsapp || '',
    email: school?.adminEmail || '',
    logoUrl: school?.logoUrl || ''
  });

  useEffect(() => {
    if (school) {
      setIdentityForm({
        name: school.name,
        npsn: school.npsn || '',
        accreditation: school.accreditation || 'Belum Terakreditasi',
        address: school.address || '',
        whatsapp: school.whatsapp || '',
        email: school.adminEmail || '',
        logoUrl: school.logoUrl || ''
      });
    }
  }, [school]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentityForm({ ...identityForm, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSavingContact, setIsSavingContact] = useState(false);

  const [consultationLink, setConsultationLink] = useState(
    localStorage.getItem('school_consultation_link') || 'https://wa.me/6285225025555?text=Halo%20Rasyatech,%20saya%20ingin%20konsultasi.'
  );

  const [beritaList, setBeritaList] = useState<Berita[]>(() => {
    try {
      const saved = localStorage.getItem('school_berita');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { 
        id: '1',
        title: 'Pembukaan Pendaftaran Siswa Baru Tahun Pelajaran 2026/2027', 
        date: '15 Mei 2026', 
        category: 'PPDB',
        img: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop'
      },
      { 
        id: '2',
        title: 'Workshop Kewirausahaan Digital Bersama Rasyacomp', 
        date: '10 Mei 2026', 
        category: 'Workshop',
        img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop'
      }
    ];
  });

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formNews, setFormNews] = useState<Berita>({ 
    id: '', 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    category: '', 
    img: '', 
    content: '', 
    source: 'Internal PKBM' 
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('school_berita', JSON.stringify(beritaList));
  }, [beritaList]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormNews({ ...formNews, img: base64String });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConsultation = () => {
    localStorage.setItem('school_consultation_link', consultationLink);
    alert('Link konsultasi berhasil disimpan!');
  };

  const handleSaveNews = () => {
    if (!formNews.title || !formNews.date) {
      alert('Judul dan tanggal wajib diisi');
      return;
    }

    if (isEditing) {
      setBeritaList(beritaList.map(b => b.id === formNews.id ? formNews : b));
    } else {
      const news: Berita = {
        ...formNews,
        id: Math.random().toString(36).substr(2, 9),
      };
      setBeritaList([news, ...beritaList]);
    }

    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormNews({ 
      id: '', 
      title: '', 
      date: new Date().toISOString().split('T')[0], 
      category: '', 
      img: '', 
      content: '', 
      source: 'Internal PKBM' 
    });
    setImagePreview(null);
    setIsEditing(false);
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('Hapus berita ini secara permanen?')) {
      setBeritaList(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleEditClick = (news: Berita) => {
    setFormNews(news);
    setImagePreview(news.img);
    setIsEditing(true);
    setShowForm(true);
  };

  /**
   * Site State Management for Profile, Programs, Partnerships and Contact
   */
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('school_stats');
    if (saved) return JSON.parse(saved);
    return [
      { label: 'Peserta Didik', value: '2.5k+' },
      { label: 'Guru Ahli', value: '45+' },
      { label: 'Alumni Sukses', value: '1.2k+' },
      { label: 'Program Unggul', value: '12' },
    ];
  });

  const [programs, setPrograms] = useState(() => {
    const saved = localStorage.getItem('school_programs');
    if (saved) return JSON.parse(saved);
    return [
      { title: 'Kesetaraan Paket A, B, C', desc: 'Layanan pendidikan non-formal setara SD, SMP, dan SMA untuk semua usia.' },
      { title: 'Vokasi & Keterampilan', desc: 'Kursus menjahit, komputer, dan kewirausahaan untuk bekal dunia kerja.' },
      { title: 'LMS Terintegrasi AI', desc: 'Belajar lebih modern dengan platform bantuan AI eksklusif dari Armilla.' },
    ];
  });

  const [contactInfo, setContactInfo] = useState(() => {
    const saved = localStorage.getItem('school_contact');
    if (saved) return JSON.parse(saved);
    return {
      address: 'Perum Grand Lebakwangi Lestari Desa Mekarwangi Kec. Lebakwangi Kab. Kuningan',
      phone: '+62 852-2502-5555',
      email: 'pkbmarmillanusa@gmail.com',
      instagram: '@pkbmarmillanusa',
      facebook: 'PKBM Armilla Nusa'
    };
  });

  const [facilities, setFacilities] = useState(() => {
    const saved = localStorage.getItem('school_facilities');
    if (saved) return JSON.parse(saved);
    return [
      { name: 'Laboratorium Komputer', img: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&auto=format&fit=crop' },
      { name: 'Ruang Kelas Nyaman', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop' },
      { name: 'Perpustakaan Digital', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop' },
      { name: 'Area Kreatif', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('school_programs', JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem('school_contact', JSON.stringify(contactInfo));
  }, [contactInfo]);

  useEffect(() => {
    localStorage.setItem('school_facilities', JSON.stringify(facilities));
  }, [facilities]);

  const [activeSubTab, setActiveSubTab] = useState<'manage' | 'preview'>('manage');

  return (
    <div className="max-w-5xl space-y-8 pb-20">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main tracking-tight uppercase italic">{activeSubTab === 'manage' ? 'KELOLA' : 'PRATINJAU'} <span className="text-brand-accent">WEBSITE</span></h2>
          <p className="text-[10px] text-brand-text-muted font-bold tracking-widest uppercase italic">{activeSubTab === 'manage' ? 'Edit Konten Landing Page & Hubungi Kami' : 'Melihat Tampilan Live Website'}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveSubTab('manage')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all italic",
              activeSubTab === 'manage' 
                ? "bg-brand-sidebar text-white shadow-lg shadow-brand-sidebar/20" 
                : "bg-white border border-brand-border text-brand-text-main hover:bg-slate-50"
            )}
          >
            <Settings className="w-3.5 h-3.5" /> Konfigurasi
          </button>
          <button 
            onClick={() => setActiveSubTab('preview')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all italic",
              activeSubTab === 'preview' 
                ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
                : "bg-white border border-brand-border text-brand-text-main hover:bg-slate-50"
            )}
          >
            <Eye className="w-3.5 h-3.5" /> Liat Pratinjau
          </button>
        </div>
      </div>

      {activeSubTab === 'preview' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full aspect-[16/10] bg-white border border-brand-border rounded-[2.5rem] overflow-hidden shadow-2xl relative"
        >
           <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100 border-b border-brand-border flex items-center px-6 gap-2 z-10">
              <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-sm mx-auto bg-white border border-brand-border rounded-lg h-6 flex items-center px-3 gap-2">
                 <Globe className="w-2.5 h-2.5 text-slate-300" />
                 <span className="text-[8px] font-bold text-slate-400 italic">https://pkbmarmillanusa.sch.id</span>
              </div>
           </div>
           <iframe 
             src="/preview" 
             className="w-full h-full pt-10" 
             title="Website Preview"
           />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Berita Management Section */}
          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">BERITA & <span className="text-brand-accent">PENGUMUMAN</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Update berita di halaman depan</p>
              </div>
              {!showForm && (
                <button 
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="p-2 bg-brand-accent text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand-accent/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {showForm && (
              <div className="mb-8 p-6 bg-slate-50 border border-brand-border rounded-2xl space-y-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black text-brand-sidebar uppercase tracking-widest italic">
                    {isEditing ? 'Mode Edit Berita' : 'Tambah Berita Baru'}
                  </h4>
                </div>
                <input 
                  type="text" 
                  placeholder="Judul Berita" 
                  className="w-full bg-white border border-brand-border p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-accent"
                  value={formNews.title}
                  onChange={e => setFormNews({...formNews, title: e.target.value})}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Tanggal Berita</label>
                    <input 
                      type="date" 
                      className="w-full bg-white border border-brand-border p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-accent"
                      value={formNews.date}
                      onChange={e => setFormNews({...formNews, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Sumber Berita</label>
                    <select 
                      className="w-full bg-white border border-brand-border p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-accent"
                      value={formNews.source}
                      onChange={e => setFormNews({...formNews, source: e.target.value})}
                    >
                      <option value="Internal PKBM">Internal PKBM</option>
                      <option value="Luar / Eksternal">Luar / Eksternal</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5 flex-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Kategori</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Kurikulum" 
                        className="w-full bg-white border border-brand-border p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-accent"
                        value={formNews.category}
                        onChange={e => setFormNews({...formNews, category: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5 flex-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Foto Berita</label>
                      <div className="flex gap-2">
                         <label className="flex-1 bg-white border border-brand-border p-3 rounded-xl text-[10px] font-bold text-slate-400 cursor-pointer hover:border-brand-accent transition-all flex items-center justify-between">
                            <span>{formNews.img ? 'Foto Terpilih' : 'Pilih File Gambar...'}</span>
                            <Plus className="w-3 h-3" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                         </label>
                         {imagePreview && (
                            <div className="w-12 h-12 rounded-xl border border-brand-border overflow-hidden shrink-0">
                               <img src={imagePreview || undefined} className="w-full h-full object-cover" alt="" />
                            </div>
                         )}
                      </div>
                   </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Redaksi / Konten Berita</label>
                  <textarea 
                    placeholder="Tulis isi berita di sini..." 
                    className="w-full bg-white border border-brand-border p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-accent min-h-[120px] resize-none"
                    value={formNews.content}
                    onChange={e => setFormNews({...formNews, content: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveNews} className="flex-1 bg-brand-sidebar text-white py-3 rounded-xl text-[10px] font-bold uppercase italic tracking-widest">
                    {isEditing ? 'Simpan Perubahan' : 'Update Berita'}
                  </button>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="px-6 border border-brand-border rounded-xl text-[10px] font-bold uppercase italic tracking-widest">Batal</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {beritaList.map(news => (
                <div key={news.id} className="flex items-center gap-4 p-4 border border-brand-border rounded-2xl hover:bg-slate-50 transition-all group">
                   <div className="w-16 h-16 rounded-xl bg-slate-100 border border-brand-border overflow-hidden relative shrink-0">
                      {news.img ? (
                        <img src={news.img || undefined} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300 absolute inset-0 m-auto" />
                      )}
                      <div className="absolute top-1 left-1 bg-brand-sidebar/80 text-[6px] font-black text-white px-1 py-0.5 rounded uppercase">
                         {news.img?.startsWith('data:') ? 'LOKAL' : 'URL'}
                      </div>
                   </div>
                   <div className="flex-1">
                      <h4 className="text-[12px] font-bold text-brand-sidebar italic leading-tight">{news.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{news.date} • {news.category || 'Tanpa Kategori'}</p>
                         <span className={cn(
                            "text-[7px] font-black px-1.5 py-0.5 rounded uppercase",
                            news.source === 'Internal PKBM' ? "bg-brand-accent/10 text-brand-accent" : "bg-slate-100 text-slate-400"
                         )}>
                            {news.source || 'Eksternal'}
                         </span>
                      </div>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(news)}
                        className="p-2 text-slate-400 hover:text-brand-accent transition-colors"
                        title="Edit Berita Lengkap"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteNews(news.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Hapus Berita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm overflow-hidden relative group">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">SPANDUK <span className="text-brand-accent">UTAMA</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Headline utama halaman depan</p>
              </div>
              <button className="p-2 bg-brand-bg rounded-xl hover:bg-slate-50 transition-colors"><Settings className="w-4 h-4 text-slate-400" /></button>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Headline</label>
                <textarea 
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none h-20 resize-none"
                  defaultValue="BIKIN MASA DEPANMU CERAH BERSAMA PKBM ARMILLA NUSA"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Sub-Headline</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                  defaultValue="Sekolah fleksibel untuk semua kalangan. Terakreditasi dan ijazah resmi pemerintah."
                />
              </div>
              <button className="bg-brand-sidebar text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-brand-sidebar/20 hover:scale-105 transition-all italic">Update Konten</button>
            </div>
            
            <div className="absolute right-0 top-0 w-1/2 h-full bg-slate-50 border-l border-brand-border translate-x-1/2 rotate-12 group-hover:rotate-6 transition-all duration-700 -z-0" />
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">IDENTITAS <span className="text-brand-accent">SEKOLAH</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Kelola Nama, Akreditasi, dan NPSN</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Logo Sekolah</label>
                <div className="flex gap-4 items-center">
                  {identityForm.logoUrl && (
                    <img src={identityForm.logoUrl} className="w-16 h-16 object-contain border border-brand-border rounded-xl p-1 bg-white" />
                  )}
                  <label className="flex-1 bg-slate-50 border border-brand-border p-4 rounded-xl text-xs font-bold text-slate-500 cursor-pointer hover:border-brand-accent transition-all flex items-center justify-between">
                    <span>{identityForm.logoUrl ? 'Ganti Logo...' : 'Pilih File Logo...'}</span>
                    <Plus className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nama Sekolah</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                  value={identityForm.name}
                  onChange={(e) => setIdentityForm({...identityForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">NPSN</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                  value={identityForm.npsn}
                  onChange={(e) => setIdentityForm({...identityForm, npsn: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Akreditasi</label>
                <select 
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                  value={identityForm.accreditation}
                  onChange={(e) => setIdentityForm({...identityForm, accreditation: e.target.value})}
                >
                  <option value="A (Unggul)">A (Unggul)</option>
                  <option value="B (Baik)">B (Baik)</option>
                  <option value="C (Cukup)">C (Cukup)</option>
                  <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                </select>
              </div>
            </div>
            
            <button 
              disabled={isSavingIdentity || !school}
              onClick={async () => {
                if (!school) return;
                setIsSavingIdentity(true);
                try {
                  const { error } = await supabase
                    .from('schools')
                    .update({
                      name: identityForm.name,
                      npsn: identityForm.npsn,
                      accreditation: identityForm.accreditation,
                      logoUrl: identityForm.logoUrl
                    })
                    .eq('id', school.id);
                  if (error) throw error;
                  alert('Identitas sekolah berhasil diperbarui!');
                  window.location.reload();
                } catch (error: any) {
                  console.error('Update error:', error);
                  alert('Gagal memperbarui identitas: ' + (error.message || JSON.stringify(error)));
                } finally {
                  setIsSavingIdentity(false);
                }
              }}
              className="bg-brand-sidebar text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-brand-sidebar/20 hover:scale-105 transition-all italic disabled:opacity-50"
            >
              {isSavingIdentity ? 'Menyimpan...' : 'Simpan Identitas'}
            </button>
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">STATISTIK <span className="text-brand-accent">PROFIL</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Ubah angka capaian di halaman depan</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {stats.map((stat: any, i: number) => (
                 <div key={i} className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{stat.label}</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-[10px] font-bold focus:border-brand-accent outline-none"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = [...stats];
                        newStats[i].value = e.target.value;
                        setStats(newStats);
                      }}
                    />
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">FASILITAS <span className="text-brand-accent">SEKOLAH</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Daftar sarana pendukung belajar</p>
              </div>
              <button 
                onClick={() => setFacilities([...facilities, { name: 'Fasilitas Baru', img: '' }])}
                className="p-2 bg-brand-accent text-white rounded-xl shadow-lg shadow-brand-accent/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {facilities.map((f: any, i: number) => (
                 <div key={i} className="p-4 bg-slate-50 border border-brand-border rounded-2xl relative group">
                    <button 
                      onClick={() => setFacilities(facilities.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex gap-4">
                       <div className="w-16 h-16 rounded-xl bg-white border border-brand-border overflow-hidden shrink-0">
                          <img src={f.img} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="flex-1 space-y-2">
                          <input 
                            className="w-full bg-transparent border-b border-brand-border/20 text-[10px] font-black text-brand-sidebar uppercase italic outline-none focus:border-brand-accent"
                            value={f.name}
                            onChange={(e) => {
                               const newF = [...facilities];
                               newF[i].name = e.target.value;
                               setFacilities(newF);
                            }}
                          />
                          <input 
                            placeholder="URL Gambar..."
                            className="w-full bg-transparent text-[8px] font-medium text-slate-400 outline-none"
                            value={f.img}
                            onChange={(e) => {
                               const newF = [...facilities];
                               newF[i].img = e.target.value;
                               setFacilities(newF);
                            }}
                          />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">PROGRAM <span className="text-brand-accent">UNGGULAN</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Daftar program yang muncul di landing page</p>
              </div>
              <button 
                onClick={() => setPrograms([...programs, { title: 'Program Baru', desc: 'Deskripsi program...' }])}
                className="p-2 bg-brand-accent text-white rounded-xl shadow-lg shadow-brand-accent/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
               {programs.map((prog: any, i: number) => (
                 <div key={i} className="p-4 bg-slate-50 border border-brand-border rounded-2xl relative group">
                    <button 
                      onClick={() => setPrograms(programs.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <input 
                      className="w-full bg-transparent border-b border-brand-border/20 mb-2 text-xs font-black text-brand-sidebar uppercase italic outline-none focus:border-brand-accent"
                      value={prog.title}
                      onChange={(e) => {
                        const newP = [...programs];
                        newP[i].title = e.target.value;
                        setPrograms(newP);
                      }}
                    />
                    <textarea 
                      className="w-full bg-transparent text-[10px] font-medium text-slate-500 italic outline-none resize-none h-12"
                      value={prog.desc}
                      onChange={(e) => {
                        const newP = [...programs];
                        newP[i].desc = e.target.value;
                        setPrograms(newP);
                      }}
                    />
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">INFO <span className="text-brand-accent">KONTAK</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Detail alamat dan nomor telepon</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Alamat Lengkap</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none h-20 resize-none"
                    value={identityForm.address}
                    onChange={(e) => setIdentityForm({...identityForm, address: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">WhatsApp/Telepon</label>
                  <input 
                    className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                    value={identityForm.whatsapp}
                    onChange={(e) => setIdentityForm({...identityForm, whatsapp: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email Sekolah</label>
                  <input 
                    className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                    value={identityForm.email}
                    onChange={(e) => setIdentityForm({...identityForm, email: e.target.value})}
                  />
               </div>
            </div>
            
            <button 
              disabled={isSavingContact || !school}
              onClick={async () => {
                if (!school) return;
                setIsSavingContact(true);
                try {
                  const { error } = await supabase
                    .from('schools')
                    .update({
                      address: identityForm.address,
                      whatsapp: identityForm.whatsapp,
                      adminEmail: identityForm.email
                    })
                    .eq('id', school.id);
                  if (error) throw error;
                  alert('Info kontak berhasil diperbarui!');
                  window.location.reload();
                } catch (error: any) {
                  console.error('Update error:', error);
                  alert('Gagal memperbarui kontak: ' + (error.message || JSON.stringify(error)));
                } finally {
                  setIsSavingContact(false);
                }
              }}
              className="bg-brand-sidebar text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-brand-sidebar/20 hover:scale-105 transition-all italic disabled:opacity-50 mt-6"
            >
              {isSavingContact ? 'Menyimpan...' : 'Simpan Kontak'}
            </button>
          </div>

          {/* Gallery Management */}
          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">GALLERY <span className="text-brand-accent">FOTO</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Kelola foto kegiatan umum sekolah</p>
              </div>
              <label className="p-2 bg-brand-sidebar text-white rounded-xl hover:scale-105 transition-all shadow-lg cursor-pointer">
                <Plus className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const saved = localStorage.getItem('school_gallery') || '[]';
                        const gallery = JSON.parse(saved);
                        gallery.push(reader.result);
                        localStorage.setItem('school_gallery', JSON.stringify(gallery));
                        window.location.reload();
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(JSON.parse(localStorage.getItem('school_gallery') || '[]') as string[]).map((img, i) => (
                  <div key={i} className="aspect-square bg-slate-50 border border-brand-border rounded-2xl flex items-center justify-center relative group overflow-hidden">
                    <img src={img || undefined} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => {
                        const gallery = JSON.parse(localStorage.getItem('school_gallery') || '[]');
                        gallery.splice(i, 1);
                        localStorage.setItem('school_gallery', JSON.stringify(gallery));
                        window.location.reload();
                      }}
                      className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-2"
                    >
                       <Trash2 className="w-4 h-4" />
                       <span className="text-[8px] font-black uppercase italic tracking-widest mt-1">Hapus</span>
                    </button>
                  </div>
                ))}
                {JSON.parse(localStorage.getItem('school_gallery') || '[]').length === 0 && (
                   <div className="col-span-full py-12 text-center border-2 border-dashed border-brand-border rounded-2xl">
                      <ImageIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase italic">Belum ada foto di gallery</p>
                   </div>
                )}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest leading-none">LAYANAN <span className="text-brand-accent">KONSULTASI</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Atur tujuan link tombol "Buka Konsultasi" (WhatsApp/Eksternal)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Link WhatsApp/Tujuan Konsultasi</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-4 text-xs font-bold focus:border-brand-accent outline-none"
                  value={consultationLink}
                  onChange={e => setConsultationLink(e.target.value)}
                  placeholder="Contoh: https://wa.me/628..."
                />
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] text-amber-700 font-bold italic leading-relaxed">
                   * Tautan ini akan digunakan sebagai jalur komunikasi teknis antara Admin Sekolah ke Super Admin.
                </p>
              </div>
              <button 
                onClick={handleSaveConsultation}
                className="bg-brand-sidebar text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-brand-sidebar/20 hover:scale-105 transition-all italic"
              >
                Simpan Link
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white border border-brand-border rounded-[2rem] p-6 shadow-sm shadow-brand-sidebar/5">
              <h3 className="text-sm font-black text-brand-sidebar uppercase italic tracking-widest mb-6">SITE <span className="text-brand-accent">STATS</span></h3>
              <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl border border-brand-border text-brand-accent"><Eye className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Kunjungan Hari Ini</p>
                       <p className="text-lg font-black text-brand-sidebar leading-none tracking-tighter italic">1,245</p>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl border border-brand-border text-brand-accent"><MousePointer2 className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">CTR Ads</p>
                       <p className="text-lg font-black text-brand-sidebar leading-none tracking-tighter italic">2.4%</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-brand-sidebar rounded-[2rem] p-8 text-white relative overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent mb-4 italic">Social Links</h3>
              <div className="space-y-3">
                 {['Instagram', 'Facebook', 'WhatsApp', 'YouTube'].map(s => (
                   <div key={s} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all cursor-pointer">
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">{s}</span>
                      <Settings className="w-3 h-3 text-white/40 group-hover:text-brand-accent transition-colors" />
                   </div>
                 ))}
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-brand-accent/10 rounded-full blur-2xl" />
           </div>
        </div>
      </div>
      )}
    </div>
  );
}
