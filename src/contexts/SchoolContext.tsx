import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const currentSchoolSlugRef = React.useRef<string | null>(null);

  useEffect(() => {
    currentSchoolSlugRef.current = school?.slug || null;
  }, [school]);

  useEffect(() => {
    const resolveByHostname = async () => {
      const hostname = window.location.hostname.toLowerCase().trim();

      console.log('DEBUG [SchoolContext] Resolving hostname:', hostname);

      const isMaster = hostname === 'rsch.my.id' ||
                       hostname === 'www.rsch.my.id' ||
                       hostname.includes('localhost') ||
                       (hostname.includes('run.app') &&!hostname.split('.')[0].startsWith('pkbm') &&!hostname.includes('ais-dev'));

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

      if (!slug &&!isMaster) {
        customDomain = hostname;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user &&!slug &&!customDomain) {
        const { data: profile } = await supabase
         .from('profiles')
         .select('school_id')
         .eq('id', session.user.id)
         .maybeSingle();

        if (profile?.school_id) {
          slug = profile.school_id;
        }
      }

      if (isMaster &&!slug) {
        setLoading(false);
        return;
      }

      if (slug) {
        await setSchoolBySlug(slug);
      } else if (customDomain) {
        // CUSTOM DOMAIN LOGIC - JUGA UDAH GUA BENERIN
        try {
          const { data, error } = await supabase
           .from('schools')
           .select('*')
           .eq('custom_domain', customDomain)
           .single();

          if (!error && data) {
            // Cek registration pake subdomain dari data schools
            const { data: registration, error: regError } = await supabase
             .from('registrations')
             .select('status, school_name, deleted_at, is_approved')
             .eq('subdomain', data.slug || data.id)
             .maybeSingle();

            if (regError ||!registration) {
              setIsBlocked(true);
              setError('404: Sekolah tidak ditemukan');
              setSchool(null);
              setLoading(false);
              return;
            }

            if (registration.deleted_at!== null || registration.status === 'DELETED') {
              setIsBlocked(true);
              setError('404: Sekolah sudah dihapus');
              setSchool(null);
              setLoading(false);
              return;
            }

            if (registration.status === 'SUSPENDED') {
              setIsBlocked(true);
              setError('403: Layanan ditangguhkan sementara');
              setSchool(null);
              setLoading(false);
              return;
            }

            if (registration.status!== 'ACTIVE' || registration.is_approved!== true) {
              setIsBlocked(true);
              setError('403: Layanan belum aktif');
              setSchool(null);
              setLoading(false);
              return;
            }

            const mappedData: School = {
             ...data,
              id: data.id || data.slug,
              name: registration.school_name || data.nama || data.name,
              accreditation: data.akreditasi || data.accreditation,
              address: data.alamat || data.address,
              adminEmail: data.adminEmail || data.admin_email,
              logoUrl: data.logoUrl || data.logo_url,
              themeColor: data.themeColor || data.theme_color,
              expiryDate: data.expiryDate || data.expiry_date,
              studentLimit: data.studentLimit || data.student_limit
            };
            setSchool(mappedData);
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
  }, []);

  const setSchoolBySlug = useCallback(async (slug: string) => {
    const normalizedSlug = slug.toLowerCase();

    if (currentSchoolSlugRef.current === normalizedSlug) return;

    setLoading(true);
    setError(null);
    setIsBlocked(false);
    try {
      let { data, error } = await supabase
       .from('schools')
       .select('*')
       .eq('id', normalizedSlug)
       .single();

      if (error) {
        ({ data, error } = await supabase
           .from('schools')
           .select('*')
           .eq('slug', normalizedSlug)
           .single());
      }

      if (!error && data) {
        console.log('DEBUG [SchoolContext] Found school data:', data);

        // --- INI YANG GUA UBAH TOTAL ---
        console.log('DEBUG [SchoolContext] Checking registration for subdomain:', normalizedSlug);
        const { data: registration, error: regError } = await supabase
         .from('registrations')
         .select('status, school_name, deleted_at, is_approved')
         .eq('subdomain', normalizedSlug) // FIX 1: pake 'subdomain'
         .maybeSingle();

        console.log('DEBUG [SchoolContext] Registration lookup result:', registration, 'Error:', regError);

        // FIX 2: LOGIC STATUS BARU
        if (regError ||!registration) {
          console.warn('DEBUG [SchoolContext] School not found in registrations:', normalizedSlug);
          setIsBlocked(true);
          setError('404: Sekolah tidak ditemukan');
          setSchool(null);
          setLoading(false);
          return;
        }

        if (registration.deleted_at!== null || registration.status === 'DELETED') {
          console.warn('DEBUG [SchoolContext] School deleted:', normalizedSlug);
          setIsBlocked(true);
          setError('404: Sekolah sudah dihapus');
          setSchool(null);
          setLoading(false);
          return;
        }

        if (registration.status === 'SUSPENDED') {
          console.warn('DEBUG [SchoolContext] School suspended:', normalizedSlug);
          setIsBlocked(true);
          setError('403: Layanan ditangguhkan sementara');
          setSchool(null);
          setLoading(false);
          return;
        }

        if (registration.status!== 'ACTIVE' || registration.is_approved!== true) {
          console.warn('DEBUG [SchoolContext] School not active/approved:', normalizedSlug);
          setIsBlocked(true);
          setError('403: Layanan belum aktif');
          setSchool(null);
          setLoading(false);
          return;
        }

        const schoolName = registration.school_name;

        const mappedData: School = {
         ...data,
          id: data.id || data.slug,
          name: schoolName || data.nama || data.name,
          accreditation: data.akreditasi || data.accreditation,
          address: data.alamat || data.address,
          adminEmail: data.adminEmail || data.admin_email,
          logoUrl: data.logoUrl || data.logo_url,
          themeColor: data.themeColor || data.theme_color,
          expiryDate: data.expiryDate || data.expiry_date,
          studentLimit: data.studentLimit || data.student_limit
        };
        setSchool(mappedData);
        setIsBlocked(false);
        setError(null);
      } else {
        console.log('DEBUG: School NOT found or error:', error);
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
