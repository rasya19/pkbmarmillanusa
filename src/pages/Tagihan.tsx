import React, { useState, useEffect } from 'react';
import { 
  Wallet, Search, Filter, Plus, ArrowUpRight, ArrowDownRight, 
  MoreVertical, FileText, CheckCircle2, XCircle, Clock, Check, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface Bills {
  id: string; // The Firestore doc id
  billId: string; // The display ID like TGH-001
  studentName: string;
  studentClass: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo';
  vaNumber?: string;
}

const DUMMY_BILLS: Partial<Bills>[] = [
  {
    billId: 'TGH-001',
    studentName: 'Ahmad Rafli',
    studentClass: 'X IPA 1',
    amount: 1500000,
    description: 'SPP Bulan Mei 2026',
    dueDate: '2026-05-10',
    status: 'Belum Lunas'
  },
  {
    billId: 'TGH-002',
    studentName: 'Siti Sarah',
    studentClass: 'X IPA 1',
    amount: 3500000,
    description: 'Uang Gedung Semester 1',
    dueDate: '2026-05-15',
    status: 'Jatuh Tempo'
  },
  {
    billId: 'TGH-003',
    studentName: 'Budi Santoso',
    studentClass: 'XI IPS 2',
    amount: 1500000,
    description: 'SPP Bulan Mei 2026',
    dueDate: '2026-05-10',
    status: 'Lunas',
    vaNumber: '880192839102'
  }
];

export default function Tagihan() {
  const [bills, setBills] = useState<Bills[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedBill, setSelectedBill] = useState<Bills | null>(null);
  const [isVaModalOpen, setIsVaModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const { data, error } = await supabase
          .from('tagihan')
          .select('*')
          .order('billId', { ascending: true });
        
        if (error) throw error;
        setBills(data || []);
      } catch (error) {
        console.error('Error fetching bills:', error);
        toast.error('Gagal mengambil data tagihan.');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bill.billId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Bills['status']) => {
    switch (status) {
      case 'Lunas': return 'bg-green-100 text-green-700 border-green-200';
      case 'Belum Lunas': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Jatuh Tempo': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const generateVA = async (bill: Bills) => {
    const newVa = '880' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    try {
      const { error } = await supabase
        .from('tagihan')
        .update({ vaNumber: newVa })
        .eq('id', bill.id);
      
      if (error) throw error;
      
      setSelectedBill({ ...bill, vaNumber: newVa });
      setIsVaModalOpen(true);
      // Re-fetch or update state
      setBills(prev => prev.map(b => b.id === bill.id ? { ...b, vaNumber: newVa } : b));
    } catch (e) {
      console.error(e);
      toast.error('Gagal generate VA, coba lagi.');
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tagihan')
        .update({ status: 'Lunas' })
        .eq('id', id);
        
      if (error) throw error;
      
      setIsVaModalOpen(false);
      // Re-fetch or update state
      setBills(prev => prev.map(b => b.id === id ? { ...b, status: 'Lunas' } : b));
      toast.success('Pembayaran berhasil dikonfirmasi!');
    } catch (e) {
      console.error(e);
      toast.error('Gagal update status, periksa koneksi.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-sidebar uppercase tracking-tight italic">Tagihan <span className="text-brand-accent">Siswa</span></h1>
          <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mt-1">Kelola Tagihan & Pembayaran Terintegrasi Xendit</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-brand-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama siswa atau no. tagihan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-brand-border rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-brand-border rounded-xl p-1.5 w-full md:w-auto overflow-x-auto">
              {['Semua', 'Belum Lunas', 'Lunas', 'Jatuh Tempo'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    statusFilter === status 
                      ? "bg-white shadow-sm text-brand-accent" 
                      : "text-slate-500 hover:text-brand-sidebar"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border/50">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Tagihan</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama & Kelas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jatuh Tempo</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <span className="text-xs font-bold text-brand-sidebar">{bill.billId || bill.id.substring(0,8)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-brand-sidebar">{bill.studentName}</span>
                      <span className="text-[10px] text-brand-text-muted mt-0.5">{bill.studentClass}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-brand-sidebar">{bill.description}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-brand-sidebar">Rp {bill.amount.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-brand-sidebar">{bill.dueDate}</span>
                  </td>
                  <td className="p-4">
                    <span className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border", getStatusColor(bill.status))}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {bill.status !== 'Lunas' ? (
                      <button 
                        onClick={() => generateVA(bill)}
                        className="bg-brand-sidebar text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors inline-flex items-center gap-2"
                      >
                        Bayar <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="bg-green-50 text-green-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200 inline-flex items-center gap-2 cursor-not-allowed"
                      >
                         <Check className="w-3 h-3" /> Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VA Modal */}
      <AnimatePresence>
        {isVaModalOpen && selectedBill && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVaModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] border border-brand-border p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 shadow-inner">
                  <Wallet className="w-8 h-8" />
                </div>
                <h3 className="font-black text-brand-sidebar uppercase italic tracking-widest text-xl">Xendit <span className="text-blue-600">Virtual Account</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic mt-1">Selesaikan Pembayaran Segera</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-brand-border space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Nama</span>
                  <span className="font-black text-brand-sidebar">{selectedBill.studentName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Tagihan</span>
                  <span className="font-black text-brand-sidebar">{selectedBill.description}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Total</span>
                  <span className="font-black text-brand-accent">Rp {selectedBill.amount.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-brand-border border-dashed text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">No. Virtual Account</p>
                  <div className="text-2xl font-black text-brand-sidebar tracking-widest p-4 bg-white rounded-xl border border-brand-border select-all">
                    {selectedBill.vaNumber}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsVaModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => markAsPaid(selectedBill.id)}
                  className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simulasi Lunas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
