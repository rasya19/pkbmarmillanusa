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
  tipe_lembaga?: 'KESETARAAN' | 'REGULER';
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
  
  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isMaster = hostname.includes('rsch.my.id') || 
                     hostname.includes('pkbmarmillanusa') || 
                     hostname.includes('run.app') || 
                     hostname.includes('vercel.app') ||
                     hostname.includes('localhost') ||
                     hostname.includes('ais-dev') ||
                     hostname.includes('ais-pre');
    
    if (isMaster && isBlocked) {
      setIsBlocked(false);
    }
  }, [isBlocked]);
  
  const currentSchoolSlugRef = React.useRef<string | null>(null);

  useEffect(() => {
    currentSchoolSlugRef.current = school?.slug || null;
  }, [school]);

  useEffect(() => {
    const resolveByHostname = async () => {
      const hostname = window.location.hostname.toLowerCase().trim();
      console.log('DEBUG [SchoolContext] Resolving for hostname:', hostname);

      let slug = '';
      
      // MANDAT MUTLAK: Deteksi ArmillaNusa atau Lingkungan Lokal
      if (hostname.includes('armillanusa') || hostname === 'localhost' || hostname === '127.0.0.1') {
        slug = 'armillanusa';
        console.log('DEBUG [SchoolContext] SLUG DIPAKSA KE ARMILLANUSA:', slug);
      } 
      // Platform domain resolution (rsch.my.id)
      else if (hostname.endsWith('.rsch.my.id')) {
        const platformSuffix = 'rsch.my.id';
        const slugPart = hostname.substring(0, hostname.length - platformSuffix.length - 1);
        if (slugPart) {
          slug = slugPart.split('.')[0];
          console.log('DEBUG [SchoolContext] Extracted slug from platform domain:', slug);
        }
      }

      const isMaster = hostname === 'rsch.my.id' || 
                       hostname.includes('ais-dev') || 
                       hostname.includes('ais-pre') ||
                       (hostname.includes('run.app') && !hostname.includes('armillanusa')) ||
                       (hostname.includes('vercel.app') && !hostname.includes('armillanusa'));
      
      setIsMasterDomain(isMaster);
      
      if (isMaster) {
        setIsBlocked(false);
      }
      
      let customDomainPath = hostname;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !slug) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile?.school_id) {
          console.log('DEBUG [SchoolContext] Using slug from user profile:', profile.school_id);
          slug = profile.school_id;
        }
      }

      // If we are on master landing page and no specific school context is found
      if (isMaster && !slug) {
        console.log('DEBUG [SchoolContext] Master domain landing, no school resolution needed.');
        setLoading(false);
        return;
      }

      // Priority 1: Try resolving by slug
      if (slug) {
        try {
          const { data, error: slugError } = await supabase
            .from('schools')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (data && !slugError) {
            console.log('DEBUG [SchoolContext] Found school by slug:', data.name);
            await setSchoolBySlug(slug);
            return; // Success
          }
          console.warn('DEBUG [SchoolContext] Slug lookup failed for:', slug, slugError);
        } catch (e) {
          console.error('DEBUG [SchoolContext] Slug resolution error:', e);
        }
      }

      // Priority 2: Fallback to resolving by custom domain
      if (customDomainPath) {
        console.log('DEBUG [SchoolContext] Attempting lookup by custom_domain:', customDomainPath);
        try {
          const { data, error: domainError } = await supabase
            .from('schools')
            .select('*')
            .eq('custom_domain', customDomainPath)
            .maybeSingle();
            
          if (!domainError && data) {
            console.log('DEBUG [SchoolContext] Found school by custom_domain:', data.name);
            const rawStatus = data.status;
            const isStatusActive = rawStatus === undefined || rawStatus === null || 
                                  rawStatus.toLowerCase() === 'active' || 
                                  rawStatus === true || 
                                  data.is_active === true ||
                                  data.is_active === undefined;
            
            if (!isStatusActive) {
              setError('Sekolah belum aktif');
              setSchool(null);
            } else {
              const { data: registration } = await supabase
                .from('registrations')
                .select('status, school_name')
                .eq('subdomain', data.slug)
                .maybeSingle();
              
              const isVerified = (registration && registration.status === 'approved') || isMaster || hostname.includes('armillanusa');

              if (!isVerified) {
                setIsBlocked(true);
                setError('403: Layanan Nonaktif');
                setSchool(null);
                setLoading(false);
                return;
              }
              const mappedData: School = {
                ...data,
                id: data.id, 
                name: registration?.school_name || data.name || 'PKBM Armilla Nusa',
                accreditation: data.akreditasi || data.accreditation,
                address: data.alamat || data.address,
                adminEmail: data.admin_email,
                logoUrl: data.logo_url,
                themeColor: data.theme_color,
                expiryDate: data.expiry_date,
                studentLimit: data.student_limit,
                tipe_lembaga: data.tipe_lembaga || 'KESETARAAN'
              };
              setSchool(mappedData);
              setError(null);
            }
          } else {
            console.warn('DEBUG [SchoolContext] All lookups failed. Domain error:', domainError);
            setError('Sekolah tidak ditemukan');
          }
        } catch (err) {
          console.error('DEBUG [SchoolContext] Domain resolution crash:', err);
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
    const hostname = window.location.hostname.toLowerCase().trim();
    
    if (currentSchoolSlugRef.current === normalizedSlug) return;
    
    setLoading(true);
    setError(null);
    try {
      // Strictly fetch by slug column (Mandat Mutlak Pak Ismanto - ANTI UUID ERROR)
      const { data, error: fetchError } = await supabase
        .from('schools')
        .select('*')
        .eq('slug', normalizedSlug)
        .single();
      
      if (!fetchError && data) {
        setIsBlocked(false);
        
        const rawStatus = data.status;
        const isActiveCol = data.is_active;
        const isStatusActive = rawStatus === undefined || rawStatus === null || 
                              rawStatus.toLowerCase() === 'active' || 
                              rawStatus === true || 
                              isActiveCol === true ||
                              isActiveCol === undefined;

        if (!isStatusActive) {
          setError('Sekolah belum aktif atau belum diverifikasi');
          setSchool(null);
        } else {
          const mappedData: School = {
            ...data,
            id: data.id,
            name: data.name || 'PKBM Armilla Nusa',
            accreditation: data.akreditasi || data.accreditation,
            address: data.alamat || data.address,
            adminEmail: data.admin_email,
            logoUrl: data.logo_url,
            themeColor: data.theme_color,
            expiryDate: data.expiry_date,
            studentLimit: data.student_limit,
            tipe_lembaga: data.tipe_lembaga || 'KESETARAAN'
          };
          setSchool(mappedData);
        }
      } else {
        setSchool(null);
        setError('Sekolah tidak ditemukan');
      }
    } catch (err) {
      setError('Gagal memuat data sekolah');
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
