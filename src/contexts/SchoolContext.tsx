import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface School {
  id: string;
  name: string;
  slug: string;
  npsn?: string;
  accreditation?: string;
  address?: string;
  whatsapp?: string;
  adminEmail?: string;
  logoUrl?: string;
  themeColor?: string;
  status: string;
  expiryDate?: string;
  studentLimit?: number;
  custom_domain?: string;
  subscription_plan?: 'Silver' | 'Gold' | 'Platinum';
}

interface SchoolContextType {
  school: School | null;
  loading: boolean;
  isMasterDomain: boolean;
  error: string | null;
  isBlocked: boolean;
  setSchoolBySlug: (slug: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMasterDomain, setIsMasterDomain] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const currentSchoolSlugRef = useRef<string | null>(null);

  useEffect(() => {
    currentSchoolSlugRef.current = school?.slug || null;
  }, [school]);

  // Fungsi internal untuk memetakan data sekolah dari DB snake_case ke camelCase interface
  const mapSchoolData = (schoolData: any, registrationData: any): School => {
    return {
      ...schoolData,
      id: schoolData.id || schoolData.slug,
      name: registrationData.school_name || schoolData.nama || schoolData.name,
      accreditation: schoolData.akreditasi || schoolData.accreditation,
      address: schoolData.alamat || schoolData.address,
      adminEmail: schoolData.adminEmail || schoolData.admin_email,
      logoUrl: schoolData.logoUrl || schoolData.logo_url,
      themeColor: schoolData.themeColor || schoolData.theme_color,
      expiryDate: schoolData.expiryDate || schoolData.expiry_date,
      studentLimit: schoolData.studentLimit || schoolData.student_limit
    };
  };

  // Fungsi resolusi utama berdasarkan Slug / Subdomain
  const setSchoolBySlug = useCallback(async (slug: string) => {
    const normalizedSlug = slug.toLowerCase();

    if (currentSchoolSlugRef.current === normalizedSlug) return;

    setLoading(true);
    setError(null);
    setIsBlocked(false); 
    
    try {
      let { data, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', normalizedSlug)
        .single();

      if (schoolError) {
        ({ data, error: schoolError } = await supabase
            .from('schools')
            .select('*')
            .eq('slug', normalizedSlug)
            .single());
      }

      if (!schoolError && data) {
        console.log('DEBUG [SchoolContext] Found school data:', data);
        
        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .select('status, school_name, is_approved')
          .eq('subdomain', normalizedSlug)
          .maybeSingle();

        if (regError || !registration) {
          setIsBlocked(true);
          setError('404: Sekolah tidak ditemukan');
          setSchool(null);
          return;
        }

        const regStatus = registration.status?.toUpperCase();

        if (regStatus === 'DELETED') {
          setIsBlocked(true);
          setError('404: Sekolah sudah dihapus');
          setSchool(null);
          return;
        }

        if (regStatus === 'SUSPENDED') {
          setIsBlocked(true);
          setError('403: Layanan ditangguhkan sementara');
          setSchool(null);
          return;
        }

        // Menerima status ACTIVE maupun VERIFIED
        const isApprovedAndValid = (regStatus === 'ACTIVE' || regStatus === 'VERIFIED') && registration.is_approved === true;

        if (!isApprovedAndValid) {
          setIsBlocked(true);
          setError('403: Layanan belum aktif');
          setSchool(null);
          return;
        }

        setIsBlocked(false);
        setError(null);
        setSchool(mapSchoolData(data, registration));
      } else {
        setSchool(null);
        setError('Sekolah tidak ditemukan');
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('Fetch school error:', err);
      setError('Gagal memuat data sekolah');
      setIsBlocked(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efek inisialisasi berdasarkan Hostname saat aplikasi dimuat
  useEffect(() => {
    const resolveByHostname = async () => {
      const hostname = window.location.hostname.toLowerCase().trim();
      console.log('DEBUG [SchoolContext] Resolving hostname:', hostname);

      const isMaster = hostname === 'rsch.my.id' ||
                       hostname === 'www.rsch.my.id' ||
                       hostname.includes('localhost') ||
                       (hostname.includes('run.app') && !hostname.split('.')[0].startsWith('pkbm') && !hostname.includes('ais-dev'));

      setIsMasterDomain(isMaster);

      let slug = '';
      let customDomain = '';

      if (hostname.includes('rsch.my.id')) {
        const parts = hostname.split('.');
        if (parts.length > 3) slug = parts[0];
      } else if (hostname.includes('run.app') || hostname.includes('vercel.app')) {
        const match = hostname.match(/pkbm[a-z0-9]+/i);
        if (match) slug = match[0];
      }

      if (!slug && !isMaster) {
        customDomain = hostname;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !slug && !customDomain) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.school_id) {
          slug = profile.school_id;
        }
      }

      if (isMaster && !slug) {
        setLoading(false);
        return;
      }

      if (slug) {
        await setSchoolBySlug(slug);
      } else if (customDomain) {
        try {
          const { data, error: domainError } = await supabase
            .from('schools')
            .select('*')
            .eq('custom_domain', customDomain)
            .single();

          if (!domainError && data) {
            const { data: registration, error: regError } = await supabase
              .from('registrations')
              .select('status, school_name, is_approved')
              .eq('subdomain', data.slug || data.id)
              .maybeSingle();

            if (regError || !registration) {
              setIsBlocked(true);
              setError('404: Sekolah tidak ditemukan');
              setSchool(null);
              return;
            }

            const domainRegStatus = registration.status?.toUpperCase();

            if (domainRegStatus === 'DELETED') {
              setIsBlocked(true);
              setError('404: Sekolah sudah dihapus');
              setSchool(null);
              return;
            }

            if (domainRegStatus === 'SUSPENDED') {
              setIsBlocked(true);
              setError('403: Layanan ditangguhkan sementara');
              setSchool(null);
              return;
            }

            const isDomainApprovedAndValid = (domainRegStatus === 'ACTIVE' || domainRegStatus === 'VERIFIED') && registration.is_approved === true;

            if (!isDomainApprovedAndValid) {
              setIsBlocked(true);
              setError('403: Layanan belum aktif');
              setSchool(null);
              return;
            }

            setIsBlocked(false);
            setError(null);
            setSchool(mapSchoolData(data, registration));
          } else {
            setError('Sekolah tidak ditemukan');
          }
        } catch (err) {
          console.error('Custom domain resolution error:', err);
          setError('Gagal memproses domain');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    resolveByHostname();
  }, [setSchoolBySlug]);

  return (
    <SchoolContext.Provider value={{ school, loading, isMasterDomain, error, isBlocked, setSchoolBySlug }}>
      {children}
    </SchoolContext.Provider>
  );
}

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
