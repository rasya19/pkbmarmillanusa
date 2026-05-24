import { SCHOOL_NAME, getSchoolParts } from '../constants';
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSchool } from '../contexts/SchoolContext';
import { 
  LayoutDashboard, 
  User,
  Users, 
  UserCheck, 
  GraduationCap, 
  BookOpen,
  Book, 
  ClipboardCheck, 
  FileBarChart, 
  ScrollText, 
  UserPlus, 
  Megaphone,
  LogOut,
  Bell,
  Search,
  Calendar,
  Clock,
  ChevronDown,
  FileText,
  Layers,
  ArrowUpCircle,
  Globe,
  Check,
  Link2,
  Wallet,
  Settings,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ScanFace,
  FolderOpen,
  Library,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import UpgradeModal from './UpgradeModal';
import DemoModeBanner from './DemoModeBanner';
import ForcePasswordChangeModal from './ForcePasswordChangeModal';

import { supabase } from '../lib/supabase';

type Role = 'SuperAdmin' | 'Admin' | 'Guru' | 'Siswa' | 'Tamu';

export default function Layout() {
  const { schoolSlug } = useParams();
  const { school, isMasterDomain, isBlocked, loading: schoolLoading } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('userRole') as Role) || 'Siswa');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-brand-sidebar">
        <div className="text-center p-8">
          <h1 className="text-6xl font-black italic">403</h1>
          <p className="text-xl font-bold mt-4">Layanan Nonaktif</p>
          <p className="text-sm mt-2 text-slate-500">Sekolah atau institusi Anda saat ini tidak aktif.</p>
        </div>
      </div>
    );
  }

  // Sync role from localStorage on mount and when it changes
  useEffect(() => {
    const storedRole = (localStorage.getItem('userRole') as Role) || 'Siswa';
    if (storedRole !== role) {
      setRole(storedRole);
    }
  }, [role]); // Only sync when role state changes or on mount
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  const [userPlan, setUserPlan] = useState<'Silver' | 'Gold' | 'Platinum' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Master Data': false,
    'Akademik': false,
    'Ujian Online': false,
    'Keuangan': false
  });

  // Fetch User Plan, Approval Status, and Force Password Change
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auto Logout (Session Timeout) - 15 minutes of inactivity
  useEffect(() => {
    const currentRole = localStorage.getItem('userRole');
    if (currentRole !== 'Guru' && currentRole !== 'Siswa') return;

    let logoutTimer: any;
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(handleAutoLogout, IDLE_TIMEOUT);
    };

    const handleAutoLogout = async () => {
      console.log('Session timeout reached. Logging out...');
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      localStorage.removeItem('activeSchool');
      
      toast.error('Sesi Anda telah berakhir demi keamanan. Silakan login kembali.', {
        id: 'session-timeout',
        duration: 5000
      });

      const prefix = schoolSlug ? `/s/${schoolSlug}` : '';
      navigate(`${prefix}/login`);
    };

    // Event listeners
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Initial start
    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [location.pathname, navigate, schoolSlug]);

  // Auth & Session Persistence Guard
  useEffect(() => {
    let authListener: any;

    async function checkSession() {
      const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
      if (isDemoMode) {
        setIsCheckingAuth(false);
        return;
      }

      // 1. Initial Get User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        const rawRole = localStorage.getItem('userRole') || 'Siswa';
        const lowerRole = rawRole.toLowerCase();

        // 1a. ADMIN BYPASS (BARIS PALING ATAS - CRITICAL FIX)
        if (lowerRole === 'admin' || lowerRole === 'superadmin' || user.user_metadata?.role?.toLowerCase() === 'admin') {
          console.log('DEBUG [Auth] Admin bypass confirmed for:', user.email);
          setRole(lowerRole.includes('super') ? 'SuperAdmin' : 'Admin');
          setMustChangePassword(false);
          setIsApproved(true);
          setIsCheckingAuth(false);
          return;
        }

        const currentRole = rawRole as Role;
        
        // 2. Immediate Security Check for Teachers/Students
        const adminRoles = ['Admin', 'SuperAdmin'];
        if (!adminRoles.includes(currentRole) && (currentRole === 'Guru' || currentRole === 'Siswa')) {
          const table = currentRole === 'Guru' ? 'profiles_guru' : 'profiles_siswa';
          const { data: userData } = await supabase
            .from(table)
            .select('must_change_password, harus_mengubah_kata_sandi')
            .eq('id', user.id)
            .maybeSingle();
          
          const forceChange = userData?.must_change_password === true || userData?.harus_mengubah_kata_sandi === true;
          setMustChangePassword(forceChange);
        } else {
          // Explicitly clear for Admins (Backup check)
          setMustChangePassword(false);
        }

        // 3. Admin Roles & Permissions
        const principalEmails = ['ismanto095@gmail.com', 'pkbmarmillanusa@gmail.com', 'armillanusa@gmail.com'];
        const isStaffOrStudent = currentRole === 'Guru' || currentRole === 'Siswa';
        
        if (!isStaffOrStudent && user.email && principalEmails.includes(user.email.toLowerCase().trim())) {
          const forcedRole = user.email.toLowerCase().trim() === 'ismanto095@gmail.com' ? 'SuperAdmin' : 'Admin';
          setRole(forcedRole);
          localStorage.setItem('userRole', forcedRole);
        }

        // 4. Fetch Profile Details
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          if (profile.subscription_plan) setUserPlan(profile.subscription_plan);
          setIsApproved(profile.is_approved ?? false);
        }
      } else {
        // No session
        setUserId(null);
        setMustChangePassword(false);
      }
      
      setIsCheckingAuth(false);
    }

    // Initialize check
    checkSession();

    // Set up auth state change listener to handle browser reopens/re-auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DEBUG [Layout] Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSession();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setMustChangePassword(false);
        setIsCheckingAuth(false);
        const prefix = schoolSlug ? `/s/${schoolSlug}` : '';
        navigate(`${prefix}/login`);
      }
    });

    authListener = subscription;

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, [location.pathname, schoolSlug, navigate]);

  // Redirect if not approved (Only for Admin - SuperAdmin is exempt)
  useEffect(() => {
    const currentRole = localStorage.getItem('userRole');
    if (currentRole === 'SuperAdmin') return; // BYPASS MUTLAK
    
    const isAdminOnly = currentRole === 'Admin';
    const hostname = window.location.hostname.toLowerCase();
    const isArmillaInstance = hostname.includes('pkbmarmillanusa') || school?.slug === 'pkbmarmillanusa';
    
    // Bypass for Armilla Nusa
    if (isArmillaInstance) return;

    if (isAdminOnly && isApproved === false && location.pathname !== '/pending-activation') {
      navigate('/pending-activation');
    }
  }, [isApproved, location.pathname, navigate, school?.slug]);

  // URL Guard for Tamu/Guest Role & Subscription Plan
  useEffect(() => {
    const prefix = schoolSlug ? `/s/${schoolSlug}` : '';
    const currentPath = location.pathname;

    const isAdmin = role === 'Admin' || role === 'SuperAdmin';

    if (role === 'Tamu') {
      const allowedPaths = ['/dashboard/diskusi', '/dashboard/settings', '/login'];
      const normalizedAllowed = allowedPaths.map(p => prefix + p);
      const isAllowed = normalizedAllowed.some(p => currentPath === p) || currentPath === '/' || currentPath === prefix + '/';
      
      if (!isAllowed) {
        toast.error('Akses Terbatas: Anda login sebagai Tamu.');
        const target = prefix + '/dashboard/diskusi';
        if (currentPath !== target) navigate(target);
      }
      return;
    }

    // Subscription Plan Guard
    const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
    const demoPlan = localStorage.getItem('demoPlan');
    const plan = isDemoMode ? (demoPlan || 'Silver') : (school?.subscription_plan || 'Silver');

    // ROBUST REDIRECT GUARD: Wait for school data to resolve before making plan-based redirects
    if (schoolLoading) return;

    if (isAdmin) {
      
      const goldFeatures = ['/dashboard/keuangan', '/dashboard/tagihan', '/dashboard/raport', '/dashboard/analitik'];
      const platinumFeatures = ['/dashboard/aset', '/dashboard/statistik']; 
      
      const isGoldPath = goldFeatures.some(p => currentPath.includes(p));
      const isPlatinumPath = platinumFeatures.some(p => currentPath.includes(p));

      let featureName = '';
      if (isPlatinumPath) featureName = currentPath.includes('aset') ? 'Manajemen Aset' : 'Statistik Eksekutif';
      if (isGoldPath) {
        if (currentPath.includes('keuangan')) {
          featureName = 'Manajemen Keuangan';
        } else if (currentPath.includes('tagihan')) {
          featureName = 'Tagihan';
        } else {
          featureName = 'E-Rapor';
        }
      }

      const dashboardPath = prefix + '/dashboard';

      if (plan === 'Silver' && (isGoldPath || isPlatinumPath)) {
        setLockedFeatureName(featureName);
        setIsUpgradeModalOpen(true);
        if (currentPath !== dashboardPath) navigate(dashboardPath);
      } else if (plan === 'Gold' && isPlatinumPath) {
        setLockedFeatureName(featureName);
        setIsUpgradeModalOpen(true);
        if (currentPath !== dashboardPath) navigate(dashboardPath);
      }
    }
  }, [role, location.pathname, navigate, schoolSlug, school]);

  // Dynamic Theme Logic
  useEffect(() => {
    const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
    const demoPlan = localStorage.getItem('demoPlan');
    const activePlan = isDemoMode ? (demoPlan || 'Silver') : (userPlan || school?.subscription_plan || 'Silver');
    if (activePlan === 'Platinum') {
      document.documentElement.style.setProperty('--color-brand-accent', '#D4AF37');
      document.documentElement.style.setProperty('--color-brand-sidebar', '#1a1a1a');
      document.body.style.transition = 'all 0.5s ease-in-out';
    } else {
      document.documentElement.style.setProperty('--color-brand-accent', '#3b82f6');
      document.documentElement.style.setProperty('--color-brand-sidebar', '#0f172a');
    }
  }, [school?.subscription_plan, userPlan]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Use school data from context if available, fallback to constants
  const schoolDisplayName = school?.name || SCHOOL_NAME;
  
  // Robust branding logic: If school data exists (Slug detected), use it.
  // Only use Rasyatech as default if we are on the master domain and no school resolved.
  const isIdentityResolved = !!school?.name;
  
  const parts = isIdentityResolved
    ? { 
        first: school.name.split(' ')[0], 
        rest: school.name.split(' ').slice(1).join(' ') 
      }
    : (isMasterDomain ? getSchoolParts() : { first: 'Portal', rest: 'Pendidikan' });

  const schoolFirst = parts.first;
  const schoolRest = parts.rest;

  // Sync role to localStorage if changed (for demo purposes)
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
    setIsRoleMenuOpen(false);
  };

  const handleLogout = async () => {
    const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
    try {
      const studentId = localStorage.getItem('studentId');
      if (studentId && !isDemoMode) {
        await supabase.from('profiles_siswa').update({ is_online: false }).eq('id', studentId);
      }
      // Attempt sign out but don't strictly await it to prevent "stuck" redirects
      supabase.auth.signOut().catch(e => console.warn('Sign out error:', e));
    } catch (err) {
      console.warn('Logout try/catch error:', err);
    }

    // Clear storage first for immediate session termination in the browser
    const keysToRemove = [
      'userRole', 
      'isDemoMode', 
      'adminName', 
      'teacherName', 
      'studentName', 
      'studentId', 
      'studentNisn', 
      'studentClass'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Redirect immediately to portal web
    window.location.replace(schoolSlug ? `/s/${schoolSlug}/` : '/');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Password konfirmasi tidak cocok!');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsPasswordModalOpen(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      alert('Password berhasil diperbarui! Gunakan password baru untuk login berikutnya.');
    }, 1500);
  };

  const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
  const adminName = localStorage.getItem('adminName') || localStorage.getItem('teacherName') || localStorage.getItem('studentName') || (role === 'Admin' ? 'Administrator' : role);

  const getNavItems = (): (any & { isExternal?: boolean })[] => {
    const prefix = schoolSlug ? `/s/${schoolSlug}` : '';
    const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
    const demoPlan = localStorage.getItem('demoPlan');
    const plan = isDemoMode ? (demoPlan || 'Silver') : (userPlan || school?.subscription_plan || 'Silver');
    
    const getPlanRank = (p: string) => {
      if (p === 'Platinum') return 3;
      if (p === 'Gold') return 2;
      return 1;
    };

    const currentRank = getPlanRank(plan);

    const checkLocked = (minPlan: 'Silver' | 'Gold' | 'Platinum') => {
      return currentRank < getPlanRank(minPlan);
    };

    const isReguler = school?.tipe_lembaga === 'REGULER';

    switch (role) {
      case 'SuperAdmin':
      case 'Admin':
        const isAdminAtHome = role === 'SuperAdmin' && isMasterDomain;
        
        const baseItems = [
          { icon: LayoutDashboard, label: 'Dashboard', path: `${prefix}/dashboard`, minPlan: 'Silver' },
        ];

        if (isAdminAtHome) {
          return baseItems.map(item => ({
            ...item,
            isLocked: item.minPlan ? checkLocked(item.minPlan as any) : false
          }));
        }

        return [
          ...baseItems,
          { 
            icon: FolderOpen, 
            label: 'Master Data', 
            subItems: [
              { icon: Users, label: 'Data Siswa', path: `${prefix}/dashboard/data-siswa`, isLocked: false },
              { icon: UserCheck, label: 'Data Guru', path: `${prefix}/dashboard/data-guru`, isLocked: false },
              { icon: Book, label: 'Kelola Mata Pelajaran', path: `${prefix}/dashboard/mata-pelajaran`, minPlan: 'Silver' },
              { icon: Layers, label: 'Manajemen Kelas', path: `${prefix}/dashboard/kelas`, minPlan: 'Silver' },
              { icon: UserPlus, label: 'Data Pendaftar (PPDB)', path: `${prefix}/dashboard/ppdb`, minPlan: 'Silver' },
              { icon: BookMarked, label: isReguler ? 'Bank Modul (SD/SMA)' : 'Modul Kesetaraan', path: `${prefix}/dashboard/modul`, minPlan: 'Silver' },
              { icon: ShieldCheck, label: isReguler ? 'Akreditasi Sekolah' : 'Akreditasi SNP', path: `${prefix}/dashboard/akreditasi`, minPlan: 'Silver' },
            ]
          },
          {
            icon: BookOpen,
            label: 'Akademik',
            subItems: [
              { icon: Calendar, label: 'Jadwal Pelajaran', path: `${prefix}/dashboard/akademik`, minPlan: 'Silver' },
              { icon: Book, label: 'Agenda Mengajar', path: `${prefix}/dashboard/agenda`, minPlan: 'Silver' },
              { icon: UserCheck, label: 'Presensi Siswa', path: `${prefix}/dashboard/presensi`, minPlan: 'Silver' },
              { icon: BookOpen, label: 'Materi Ajar (E-Modul)', path: `${prefix}/dashboard/materi`, minPlan: 'Silver' },
              { icon: ScanFace, label: 'Deteksi Objek AI', path: `${prefix}/dashboard/deteksi-objek`, minPlan: 'Silver' },
              { icon: GraduationCap, label: 'Data Alumni', path: `${prefix}/dashboard/alumni`, minPlan: 'Gold' },
              { icon: ArrowUpCircle, label: 'Kenaikan Kelas', path: `${prefix}/dashboard/kenaikan`, minPlan: 'Gold' },
              { icon: FileText, label: 'Cek Raport', path: `${prefix}/dashboard/raport`, minPlan: 'Gold' },
              { icon: FileBarChart, label: 'Analitik e-Rapor', path: `${prefix}/dashboard/analitik`, minPlan: 'Gold' },
            ]
          },
          {
            icon: ClipboardCheck,
            label: 'Ujian Online',
            minPlan: 'Silver',
            subItems: [
              { icon: FileBarChart, label: 'Kelola Ujian', path: `${prefix}/dashboard/soal`, minPlan: 'Silver' },
              { icon: ClipboardCheck, label: 'Jadwal Ujian', path: `${prefix}/dashboard/ujian`, minPlan: 'Silver' },
              { icon: Eye, label: 'Monitoring Live', path: `${prefix}/dashboard/hasil-ujian`, minPlan: 'Silver' },
              { icon: Check, label: 'Input & Rekap Nilai', path: `${prefix}/dashboard/nilai`, minPlan: 'Silver' },
              { icon: Settings, label: 'Pengaturan Ujian', path: `${prefix}/dashboard/settings`, minPlan: 'Silver' },
            ]
          },
          {
            icon: Wallet,
            label: 'Keuangan',
            minPlan: 'Gold',
            subItems: [
              { icon: Wallet, label: 'Pembayaran', path: `${prefix}/dashboard/keuangan`, minPlan: 'Gold' },
              { icon: FileText, label: 'Tagihan', path: `${prefix}/dashboard/tagihan`, minPlan: 'Gold' },
            ]
          },
          { icon: MessageSquare, label: 'Ruang Diskusi', path: `${prefix}/dashboard/diskusi`, minPlan: 'Silver' },
          { icon: Sparkles, label: 'Asisten AI', path: `${prefix}/dashboard/ai-asisten`, minPlan: 'Silver' },
          { icon: Settings, label: 'Manajemen Web', path: `${prefix}/dashboard/site`, minPlan: 'Silver' },
          { icon: FileBarChart, label: 'Statistik Eksekutif', path: `${prefix}/dashboard/statistik`, minPlan: 'Platinum' },
          { icon: Layers, label: 'Manajemen Aset', path: `${prefix}/dashboard/aset`, minPlan: 'Platinum' },
          { icon: GraduationCap, label: 'Kartu Digital QR', path: `${prefix}/dashboard/kartu-qr`, minPlan: 'Platinum' },
          { icon: Globe, label: 'Web Utama', path: schoolSlug ? `/s/${schoolSlug}` : '/', isExternal: true },
        ].map((item: any) => ({
          ...item,
          isLocked: item.minPlan ? checkLocked(item.minPlan as any) : false,
          subItems: item.subItems?.map((sub: any) => ({
            ...sub,
            isLocked: sub.minPlan ? checkLocked(sub.minPlan) : false
          }))
        }));

      case 'Guru':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: `${prefix}/dashboard` },
          { icon: Users, label: 'Data Siswa', path: `${prefix}/dashboard/data-siswa` },
          { icon: UserCheck, label: 'Data Guru', path: `${prefix}/dashboard/data-guru` },
          {
            icon: BookOpen,
            label: 'Akademik',
            subItems: [
              { icon: Calendar, label: 'Jadwal Pelajaran', path: `${prefix}/dashboard/akademik` },
              { icon: Book, label: 'Agenda Mengajar', path: `${prefix}/dashboard/agenda` },
              { icon: UserCheck, label: 'Presensi Siswa', path: `${prefix}/dashboard/presensi` },
              { icon: BookOpen, label: 'Materi Ajar (E-Modul)', path: `${prefix}/dashboard/materi` },
              { icon: Link2, label: 'Relasi Mengajar', path: `${prefix}/dashboard/relasi` },
              { icon: FileText, label: 'Cek Raport', path: `${prefix}/dashboard/raport` },
            ]
          },
          {
            icon: ClipboardCheck,
            label: 'Ujian Online',
            subItems: [
              { icon: FileBarChart, label: 'Bank Soal (Buat Ujian)', path: `${prefix}/dashboard/soal` },
              { icon: ClipboardCheck, label: 'Jadwal Ujian', path: `${prefix}/dashboard/ujian` },
              { icon: Check, label: 'Input Nilai', path: `${prefix}/dashboard/nilai` },
            ]
          },
          { icon: MessageSquare, label: 'Ruang Diskusi', path: `${prefix}/dashboard/diskusi` },
          { icon: Sparkles, label: 'Asisten AI', path: `${prefix}/dashboard/ai-asisten` },
          { icon: BookMarked, label: isReguler ? 'Bank Modul' : 'Modul Kesetaraan', path: `${prefix}/dashboard/modul` },
          { icon: ShieldCheck, label: isReguler ? 'Data Akreditasi' : 'Data Akreditasi', path: `${prefix}/dashboard/akreditasi` },
          { icon: User, label: 'Profil Saya', path: `${prefix}/dashboard/profile` },
        ];
      case 'Tamu':
        return [
          { icon: MessageSquare, label: 'Ruang Diskusi', path: `${prefix}/dashboard/diskusi` },
          { icon: UserCheck, label: 'Profil Tamu', path: `${prefix}/dashboard/settings` },
        ];
      default: // Siswa
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: `${prefix}/dashboard` },
          { icon: UserCheck, label: 'Presensi Saya', path: `${prefix}/dashboard/presensi` },
          { icon: BookOpen, label: 'Materi Ajar (E-Modul)', path: `${prefix}/dashboard/materi` },
          { icon: BookMarked, label: isReguler ? 'Pusat Modul' : 'Modul Kesetaraan', path: `${prefix}/dashboard/modul` },
          { icon: ClipboardCheck, label: 'Ikut Ujian', path: `${prefix}/dashboard/ujian` },
          { icon: MessageSquare, label: 'Ruang Diskusi', path: `${prefix}/dashboard/diskusi` },
          { icon: FileBarChart, label: 'Nilai Saya', path: `${prefix}/dashboard/nilai` },
          { icon: FileText, label: 'Raport Saya', path: `${prefix}/dashboard/raport` },
          { icon: ScrollText, label: 'SKL Digital', path: `${prefix}/dashboard/skl` },
        ];
    }
  };

  const navItems = mustChangePassword 
    ? [{ icon: User, label: 'Ganti Password', path: (schoolSlug ? `/s/${schoolSlug}` : '') + '/dashboard/profile' }]
    : getNavItems();

  const secondaryItems = mustChangePassword ? [] : [
    { icon: Megaphone, label: 'Pengumuman', path: `${schoolSlug ? '/s/' + schoolSlug : ''}/dashboard/pengumuman` },
    { icon: MessageSquare, label: 'Kritik & Saran', path: `${schoolSlug ? '/s/' + schoolSlug : ''}/dashboard/feedback` },
  ];

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Narrow/Darkish in HD theme */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-brand-sidebar flex flex-col transition-transform duration-300 transform lg:relative lg:translate-x-0 print:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:w-20 xl:w-64"
      )}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            {school?.logoUrl ? (
              <img 
                src={school.logoUrl} 
                alt={school.name} 
                className="w-10 h-10 object-contain bg-white rounded-xl shadow-lg shadow-brand-accent/20 p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-brand-accent/20">
                {schoolFirst ? schoolFirst[0] : 'A'}
              </div>
            )}
            <div className="flex flex-col lg:hidden xl:flex">
               <h1 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-2">
                 <span>{schoolFirst} <span className="text-brand-accent">{schoolRest}</span></span>
                 {school?.subscription_plan && (
                   <span className={cn(
                     "text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest",
                     school.subscription_plan === 'Platinum' ? "bg-brand-accent text-brand-sidebar shadow-[0_0_10px_rgba(var(--brand-accent),0.3)]" :
                     school.subscription_plan === 'Gold' ? "bg-amber-400 text-slate-900" :
                     "bg-slate-700 text-slate-300"
                   )}>
                     {school.subscription_plan}
                   </span>
                 )}
               </h1>
               {!isMasterDomain && (
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mt-1.5">
                    Institusi <span className="text-brand-accent">Terverifikasi</span>
                  </span>
               )}
               {isMasterDomain && (
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mt-1.5">By <span className="text-brand-accent">Rasyacomp</span></span>
               )}
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-widest lg:hidden xl:block">Utama</p>
          {navItems.map((item) => {
            const handleLockedClick = (e: React.MouseEvent, label: string) => {
              e.preventDefault();
              setLockedFeatureName(label);
              setIsUpgradeModalOpen(true);
            };

            if (item.subItems) {
              const isOpen = openMenus[item.label];
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => item.isLocked ? handleLockedClick(null as any, item.label) : toggleMenu(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-slate-400 hover:bg-white/10 hover:text-white",
                      item.isLocked && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium text-sm lg:hidden xl:block">{item.label}</span>
                      {item.isLocked && <Lock className="w-3 h-3 text-brand-accent ml-auto lg:hidden xl:block" />}
                    </div>
                    {!item.isLocked && <ChevronDown className={cn("w-4 h-4 transition-transform lg:hidden xl:block", isOpen && "rotate-180")} />}
                  </button>
                  <AnimatePresence>
                    {isOpen && !item.isLocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-2 lg:pl-0 xl:pl-4 space-y-1">
                          {item.subItems.map((sub: any) => (
                            <NavLink
                              key={sub.path}
                              to={sub.isLocked ? '#' : sub.path}
                              onClick={(e) => {
                                if (sub.isLocked) {
                                  handleLockedClick(e, sub.label);
                                } else {
                                  setIsMobileMenuOpen(false);
                                }
                              }}
                              className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                                isActive && !sub.isLocked
                                  ? "bg-brand-accent text-white" 
                                  : "text-slate-400 hover:text-white hover:bg-white/5",
                                sub.isLocked && "opacity-60 grayscale-[0.5]"
                              )}
                            >
                              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                {sub.icon && <sub.icon className="w-4 h-4 transition-transform group-hover:scale-110" />}
                              </div>
                              <span className="font-medium text-xs lg:hidden xl:block">{sub.label}</span>
                              {sub.isLocked && <Lock className="w-3 h-3 text-brand-accent absolute right-3 lg:hidden xl:block" />}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return item.isExternal ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group justify-start text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm lg:hidden xl:block">{item.label}</span>
              </a>
            ) : (
              <NavLink
                key={item.path}
                to={item.isLocked ? '#' : item.path}
                onClick={(e) => {
                  if (item.isLocked) {
                    handleLockedClick(e, item.label);
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group justify-start relative",
                  isActive && !item.isLocked
                    ? "bg-brand-accent text-white" 
                    : "text-slate-400 hover:bg-white/10 hover:text-white",
                  item.isLocked && "opacity-60 grayscale-[0.5]"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm lg:hidden xl:block">{item.label}</span>
                {item.isLocked && <Lock className="w-3 h-3 text-brand-accent absolute right-3 lg:hidden xl:block" />}
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-widest lg:hidden xl:block">Informasi</p>
            {secondaryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group justify-start",
                  isActive 
                    ? "bg-brand-accent text-white" 
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm lg:hidden xl:block">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/5 lg:hidden xl:block">
             <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Tech Ecosystem</p>
             <p className="text-[10px] font-black text-white italic tracking-tighter uppercase">RASYAC<span className="text-brand-accent">OMP</span> <span className="text-[8px] text-slate-500 font-bold not-italic">CLOUD</span></p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all justify-start"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm lg:hidden xl:block">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col min-w-0 bg-white lg:bg-brand-bg print:bg-white print:p-0 h-full relative">
        {/* Header - HD theme is clean/white */}
        <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-4 lg:px-8 shrink-0 print:hidden gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 lg:hidden text-brand-sidebar hover:bg-slate-100 rounded-lg transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
               <h2 className="text-sm font-bold text-brand-text-main mb-0 hidden md:block">
                 {adminName} <span className="text-brand-accent italic">{role}</span>
               </h2>
               <p className="text-[10px] text-brand-text-muted uppercase tracking-wider hidden md:block">
                 {isDemoMode ? 'Sedang dalam mode uji coba publik' : (role === 'Siswa' ? 'Selamat belajar kembali' : role === 'Guru' ? 'Manajemen pembelajaran hari ini' : role === 'SuperAdmin' ? 'Akses Penuh Arsitektur Rasyatech' : 'Kendali sistem pusat Rasyatech')}
               </p>
            </div>
          </div>

          <div className="flex-1 max-w-sm px-3 py-1.5 rounded-lg bg-slate-100 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari..." 
              className="bg-transparent border-none outline-none text-xs w-full focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-4">
            {role === 'Admin' && (
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="p-1.5 text-brand-text-muted hover:bg-slate-50 hover:text-brand-accent rounded-lg transition-all cursor-pointer"
                title="Ganti Password"
              >
                <Lock className="w-5 h-5" />
              </button>
            )}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-1.5 text-brand-text-muted hover:bg-slate-50 rounded-lg transition-all cursor-pointer relative"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-accent rounded-full border-2 border-white"></span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-white border border-brand-border rounded-[1.5rem] shadow-2xl z-[100] overflow-hidden"
                  >
                    <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50/50">
                      <h3 className="text-[10px] font-black uppercase text-brand-sidebar tracking-widest italic">Notifikasi <span className="text-brand-accent">Baru</span></h3>
                      <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-brand-sidebar">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[
                        { title: 'Tagihan Baru', desc: 'Tagihan pendaftaran telah dibuat.', time: '2 menit yang lalu', icon: Wallet, color: 'bg-blue-500' },
                        { title: 'Update Sistem', desc: 'Pemeliharaan server selesai dilakukan.', time: '1 jam yang lalu', icon: Sparkles, color: 'bg-brand-accent' },
                        { title: 'Pendaftar Baru', desc: 'Siswa baru telah mendaftar via PPDB.', time: '3 jam yang lalu', icon: UserPlus, color: 'bg-green-500' },
                      ].map((n, i) => (
                        <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="flex gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm", n.color)}>
                              <n.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-brand-sidebar truncate group-hover:text-brand-accent transition-colors">{n.title}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{n.desc}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1 italic">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 bg-slate-50 text-[9px] font-black uppercase text-brand-sidebar hover:bg-brand-sidebar hover:text-white transition-all tracking-widest italic">
                      Lihat Semua Notifikasi
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Role Switcher - ONLY show for Admin role to toggle between views */}
            {role === 'Admin' && (
              <div className="relative">
                <button 
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="flex items-center gap-2 border border-brand-border pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all font-bold"
                >
                   <span className="text-[10px] font-black uppercase text-brand-accent tracking-widest">{role} VIEW</span>
                   <ChevronDown className={cn("w-3 h-3 transition-transform", isRoleMenuOpen && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isRoleMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-2 w-40 bg-white border border-brand-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-2 bg-slate-50 border-b border-brand-border">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Simulasi Role</p>
                      </div>
                      {(['Admin', 'Guru', 'Siswa', 'Tamu'] as Role[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className={cn(
                            "w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-between",
                            role === r ? "text-brand-accent" : "text-slate-500"
                          )}
                        >
                          {r} {role === r && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="w-8 h-8 bg-brand-border rounded-full border border-brand-accent flex items-center justify-center text-[10px] font-bold text-brand-text-main">
               {adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Demo Mode Banner */}
        <DemoModeBanner />

        {/* Force Password Change Modal (Global Overlay) */}
        {userId && (role === 'Guru' || role === 'Siswa') && !['Admin', 'SuperAdmin'].includes(role) && (
          <ForcePasswordChangeModal 
            isOpen={mustChangePassword}
            userId={userId}
            role={role as 'Guru' | 'Siswa'}
            onSuccess={() => setMustChangePassword(false)}
          />
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {isCheckingAuth ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Verifikasi Keamanan Sesi...</p>
            </div>
          ) : !mustChangePassword ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-[2rem] border border-dashed border-brand-accent/20">
              <ShieldAlert className="w-12 h-12 text-brand-accent mb-4 animate-bounce" />
              <h2 className="text-xl font-black text-brand-sidebar uppercase italic tracking-tighter">Akses <span className="text-brand-accent">Terkunci</span></h2>
              <p className="text-xs font-bold text-slate-500 mt-2 max-w-xs mx-auto">Selesaikan pembaruan kata sandi pada jendela pop-up untuk membuka akses dashboard Anda.</p>
            </div>
          )}
        </div>

        {/* Password Change Modal */}
        <AnimatePresence>
          {isPasswordModalOpen && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPasswordModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] border border-brand-border p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-bg rounded-2xl border border-brand-border text-brand-accent">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-brand-sidebar uppercase italic tracking-widest text-lg">GANTI <span className="text-brand-accent">PASSWORD</span></h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Pengamanan Akun Administrator</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-brand-sidebar">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Password Sekarang</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 pl-12 pr-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Password Baru</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 pl-12 pr-12 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-accent"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl py-4 pl-12 pr-4 text-xs font-bold text-brand-sidebar focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-sidebar text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-sidebar/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Simpan Perubahan <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <UpgradeModal 
          isOpen={isUpgradeModalOpen} 
          onClose={() => setIsUpgradeModalOpen(false)} 
          featureName={lockedFeatureName}
        />
      </section>

      {/* Right Panel - Dense Info (Visible on Large Screens) */}
      <aside className="w-80 bg-white border-l border-brand-border hidden xl:flex flex-col p-6 space-y-8 overflow-y-auto print:hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-text-main">Kalender Belajar</h3>
            <span className="text-[10px] font-bold text-brand-accent">Mei 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
              <span key={`${d}-${i}`} className="text-[10px] text-brand-text-muted font-bold py-1">{d}</span>
            ))}
            {Array.from({ length: 14 }, (_, i) => (
              <div 
                key={i} 
                className={cn(
                  "aspect-square flex items-center justify-center text-[11px] rounded-md transition-all cursor-pointer",
                  i === 2 ? "bg-brand-accent text-white font-bold" : "text-brand-text-main hover:bg-brand-bg"
                )}
              >
                {i + 12}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-text-main">Tugas Mendatang</h3>
          {[
            { title: 'Kuis Fotografi', deadline: 'Hari ini, 23:59', color: 'bg-brand-accent' },
            { title: 'Project Akhir', deadline: 'Besok, 18:00', color: 'bg-orange-400' },
            { title: 'Review Modul 2', deadline: 'Terlambat 2 Jam', color: 'bg-red-500' },
          ].map((task, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-brand-bg rounded-lg border-l-4" style={{ borderColor: i === 0 ? '#3b82f6' : i === 1 ? '#fbbf24' : '#ef4444' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-text-main truncate">{task.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-brand-text-muted" />
                  <span className="text-[10px] text-brand-text-muted">{task.deadline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-brand-sidebar rounded-xl p-4 text-white">
           <div className="flex items-center gap-2 mb-2">
             <Calendar className="w-4 h-4 text-brand-accent" />
             <span className="text-xs font-bold">Event Kampus</span>
           </div>
           <p className="text-[11px] text-slate-300">Webinar AI in Education akan dimulai dalam 2 jam.</p>
           <button className="w-full mt-3 py-1.5 bg-brand-accent rounded-lg text-[10px] font-bold">Ingatkan Saya</button>
        </div>
      </aside>
    </div>
  );
}
