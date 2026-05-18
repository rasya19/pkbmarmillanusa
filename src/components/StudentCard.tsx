import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, ShieldCheck, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StudentCardProps {
  student: {
    id: string;
    nisn: string;
    nama: string;
    class: string;
    photourl?: string;
  };
  schoolName?: string;
  className?: string;
}

export default function StudentCard({ student, schoolName = "PKBM RASYATECH", className }: StudentCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative w-full max-w-[360px] h-52 bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl",
        className
      )}
    >
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -ml-12 -mb-12" />
      
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white italic tracking-tighter leading-none uppercase">{schoolName}</h4>
            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Digital Student Pass</p>
          </div>
        </div>
        <div className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest border border-emerald-500/20 px-2 py-0.5 rounded-full">
          Verified
        </div>
      </div>

      <div className="p-6 flex gap-6 relative z-10">
        {/* Photo Area */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl border-2 border-white/10 overflow-hidden relative group shadow-xl">
            {student.photourl ? (
              <img src={student.photourl} alt={student.nama} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono">
            {student.id.slice(0, 8)}
          </div>
        </div>

        {/* Info Area */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Full Name</p>
            <h3 className="text-sm font-black text-white uppercase italic tracking-tight leading-tight line-clamp-1">{student.nama || 'Nama Siswa'}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Username (NISN)</p>
              <p className="text-[10px] font-bold text-slate-300 font-mono tracking-wider">{student.nisn || '0000000000'}</p>
            </div>
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Rombel / Class</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter line-clamp-1">{student.class || '12 - Paket C'}</p>
            </div>
          </div>
        </div>

        {/* QR Code Area */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-2 ml-auto">
          <div className="p-2 bg-white rounded-xl shadow-2xl">
            <QRCodeSVG 
              value={student.id} 
              size={64}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          </div>
          <p className="text-[6px] font-black text-slate-500 uppercase tracking-[0.3em]">Scan Access</p>
        </div>
      </div>

      {/* Footer Design Element */}
      <div className="absolute bottom-4 left-6 flex items-center gap-6 opacity-30">
          <div className="flex -space-x-1">
             {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />)}
          </div>
          <p className="text-[6px] font-bold text-slate-600 uppercase tracking-[0.4em] italic">Authentic Identification Device</p>
      </div>

      <button className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-12 group-hover:translate-x-0 transition-transform p-3 bg-emerald-600 text-white rounded-l-2xl opacity-0 group-hover:opacity-100 hidden">
        <Download className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
