import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Trophy, Target, Plus, Save, Trash2, Edit3, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Grade {
  mapel: string;
  uts: number;
  uas: number;
  tugas: number;
  rata: number;
}

function getPredikat(rata: number) {
  if (rata >= 85) return { label: 'Sangat Baik', color: 'text-emerald-500' };
  if (rata >= 70) return { label: 'Baik', color: 'text-blue-500' };
  if (rata >= 55) return { label: 'Cukup', color: 'text-amber-500' };
  return { label: 'Kurang', color: 'text-red-500' };
}

export default function Nilai() {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [mapels] = useState<any[]>(() => {
    const saved = localStorage.getItem('school_mapel_list');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [nilaiList, setNilaiList] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('school_nilai_list');
    if (saved) return JSON.parse(saved);
    return [
      { mapel: 'Bahasa Indonesia', uts: 85, uas: 88, tugas: 90, rata: 87.6 },
      { mapel: 'Matematika', uts: 78, uas: 80, tugas: 85, rata: 81.0 },
      { mapel: 'Sosiologi', uts: 92, uas: 90, tugas: 95, rata: 92.3 },
      { mapel: 'Keterampilan', uts: 95, uas: 98, tugas: 100, rata: 97.6 },
    ];
  });

  const [catatan, setCatatan] = useState(localStorage.getItem('school_catatan_wali') || "Budi menunjukkan progres yang sangat baik pada mata pelajaran produktif (Keterampilan). Terus tingkatkan kehadiran pada sesi tutorial online Bahasa Inggris.");

  useEffect(() => {
    localStorage.setItem('school_nilai_list', JSON.stringify(nilaiList));
  }, [nilaiList]);

  useEffect(() => {
    localStorage.setItem('school_catatan_wali', catatan);
  }, [catatan]);

  const handleAddMapel = () => {
    setNilaiList([...nilaiList, { mapel: 'Mata Pelajaran Baru', uts: 0, uas: 0, tugas: 0, rata: 0 }]);
  };

  const handleUpdateGrade = (index: number, field: keyof Grade, value: string | number) => {
    const newList = [...nilaiList];
    const item = newList[index];
    
    if (field === 'mapel') {
      item.mapel = value as string;
    } else {
      const numVal = Number(value) || 0;
      (item[field] as number) = numVal;
      // Recalculate average
      item.rata = Number(((item.uts + item.uas + item.tugas) / 3).toFixed(1));
    }
    
    setNilaiList(newList);
  };

  const handleDeleteMapel = (index: number) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      setNilaiList(nilaiList.filter((_, i) => i !== index));
    }
  };

  const totalRata = nilaiList.length > 0 
    ? (nilaiList.reduce((acc, curr) => acc + curr.rata, 0) / nilaiList.length).toFixed(2)
    : "0.00";

  const ipk = (Number(totalRata) / 25).toFixed(2); // Mock IPK calculation

  return (
    <div className="space-y-6 max-w-5xl pb-20">
       <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-bold text-brand-text-main tracking-tight uppercase underline decoration-brand-accent decoration-2">LAPORAN <span className="text-brand-accent italic">NILAI SISWA</span></h2>
          <p className="text-[10px] text-brand-text-muted font-bold tracking-widest mt-1 uppercase">Tahun Ajaran 2025/2026 • Semester Genap</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsEditMode(!isEditMode)}
             className={cn(
               "flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-widest italic",
               isEditMode ? "bg-red-500 text-white shadow-lg" : "bg-white border border-brand-border text-brand-text-main hover:bg-slate-50 shadow-sm"
             )}
           >
             {isEditMode ? <><X className="w-3.5 h-3.5" /> Keluar Mode Edit</> : <><Edit3 className="w-3.5 h-3.5" /> Mode Input Nilai</>}
           </button>
           {!isEditMode && (
             <button 
               onClick={() => {
                 sessionStorage.setItem('trigger_print', 'true');
                 navigate('/dashboard/raport');
               }}
               className="flex items-center gap-2 bg-brand-accent text-white px-6 py-2 rounded-lg text-[10px] font-bold hover:bg-brand-accent/90 transition-all uppercase tracking-widest italic shadow-lg shadow-brand-accent/20"
             >
               <Download className="w-3.5 h-3.5" /> Unduh Rapor
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Indeks Prestasi (IP)</p>
            <h3 className="text-2xl font-bold text-brand-text-main">{ipk}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rata-Rata Nilai</p>
            <h3 className="text-2xl font-bold text-brand-text-main">{totalRata}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-50/50">
           <h3 className="text-[10px] font-black text-brand-sidebar uppercase italic tracking-widest">Daftar Mata Pelajaran & Nilai</h3>
           {isEditMode && (
             <button 
               onClick={handleAddMapel}
               className="flex items-center gap-2 px-4 py-1.5 bg-brand-sidebar text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-sidebar/20"
             >
               <Plus className="w-3 h-3" /> Tambah Mata Pelajaran
             </button>
           )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border italic">Mata Pelajaran</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border text-center italic">UTS</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border text-center italic">UAS</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border text-center italic">Tugas</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-accent uppercase tracking-widest border-b border-brand-border text-center italic">Rata-Rata</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-accent uppercase tracking-widest border-b border-brand-border text-center italic">Predikat</th>
                {isEditMode && <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-brand-border text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((n, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 border-b border-brand-border">
                    {isEditMode ? (
                      <select 
                        className="bg-white border border-brand-border rounded-lg p-2 text-xs font-bold w-full uppercase outline-none focus:border-brand-accent cursor-pointer"
                        value={n.mapel}
                        onChange={e => handleUpdateGrade(i, 'mapel', e.target.value)}
                      >
                         <option value="Mata Pelajaran Baru" disabled>Pilih Mata Pelajaran...</option>
                         {mapels.map((m: any) => (
                           <option key={m.id} value={m.nama}>{m.nama} ({m.jenjang})</option>
                         ))}
                      </select>
                    ) : (
                      <span className="text-xs font-bold text-brand-text-main">{n.mapel}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-b border-brand-border text-center">
                    {isEditMode ? (
                      <input 
                        type="number" 
                        className="bg-white border border-brand-border rounded-lg p-2 text-xs font-bold w-16 text-center outline-none focus:border-brand-accent"
                        value={n.uts}
                        onChange={e => handleUpdateGrade(i, 'uts', e.target.value)}
                      />
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">{n.uts}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-b border-brand-border text-center">
                    {isEditMode ? (
                      <input 
                        type="number" 
                        className="bg-white border border-brand-border rounded-lg p-2 text-xs font-bold w-16 text-center outline-none focus:border-brand-accent"
                        value={n.uas}
                        onChange={e => handleUpdateGrade(i, 'uas', e.target.value)}
                      />
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">{n.uas}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-b border-brand-border text-center">
                    {isEditMode ? (
                      <input 
                        type="number" 
                        className="bg-white border border-brand-border rounded-lg p-2 text-xs font-bold w-16 text-center outline-none focus:border-brand-accent"
                        value={n.tugas}
                        onChange={e => handleUpdateGrade(i, 'tugas', e.target.value)}
                      />
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">{n.tugas}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-b border-brand-border text-center">
                    <span className="text-xs font-black text-brand-accent italic">{n.rata}</span>
                  </td>
                  <td className="px-6 py-4 border-b border-brand-border text-center">
                    <span className={cn("text-xs font-black uppercase tracking-widest", getPredikat(n.rata).color)}>
                      {getPredikat(n.rata).label}
                    </span>
                  </td>
                  {isEditMode && (
                    <td className="px-6 py-4 border-b border-brand-border text-center">
                       <button 
                         onClick={() => handleDeleteMapel(i)}
                         className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cn(
        "bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm transition-all",
        isEditMode && "ring-2 ring-indigo-500/20"
      )}>
         <div className="p-3 bg-indigo-100 rounded-xl">
           <FileBarChart className="w-5 h-5 text-indigo-600" />
         </div>
         <div className="flex-1">
           <h4 className="text-[10px] font-black text-indigo-900 uppercase italic tracking-widest mb-2">Catatan Wali Kelas</h4>
           {isEditMode ? (
             <textarea 
               className="w-full bg-white border border-brand-border rounded-xl p-4 text-xs font-bold outline-none focus:border-indigo-500 min-h-[100px] resize-none"
               value={catatan}
               onChange={e => setCatatan(e.target.value)}
               placeholder="Tulis catatan perkembangan siswa di sini..."
             />
           ) : (
             <p className="text-[11px] text-indigo-700 italic leading-relaxed font-medium">"{catatan}"</p>
           )}
         </div>
      </div>

      {isEditMode && (
        <div className="flex justify-center pt-4">
           <button 
             onClick={() => {
               setIsEditMode(false);
               alert('Perubahan nilai berhasil disimpan di browser Anda.');
             }}
             className="bg-brand-sidebar text-white px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] italic shadow-2xl shadow-brand-sidebar/30 hover:scale-105 transition-all flex items-center gap-3"
           >
             <Save className="w-4 h-4" /> Simpan Data Nilai
           </button>
        </div>
      )}
    </div>
  );
}

