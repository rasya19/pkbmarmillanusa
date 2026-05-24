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
      let rawHostname = window.location.hostname.toLowerCase().trim();
      // Clean www. prefix for consistent resolution
      const hostname = rawHostname.startsWith('www.') ? rawHostname.replace('www.', '') : rawHostname;
      
      console.log('DEBUG [SchoolContext] Resolving for hostname:', hostname);

      const isMaster = hostname === 'rsch.my.id' || 
                       hostname.includes('pkbmarmillanusa') ||
                       hostname.includes('localhost') || 
                       hostname.includes('127.0.0.1') || 
                       hostname.includes('ais-dev') || 
                       hostname.includes('ais-pre') || 
                       hostname.includes('run.app') ||
                       hostname.includes('vercel.app');
      
      setIsMasterDomain(isMaster);
      
      if (isMaster) {
        setIsBlocked(false);
      }
      
      let slug = '';
      let customDomainPath = hostname; // We'll try this as a fallback if slug fails

      // PRIORITY 1: Hardcode for armillanusa if detected in hostname (User Mandate)
      if (hostname.includes('armillanusa')) {
        slug = 'armillanusa';
        console.log('DEBUG [SchoolContext] Priority slug assigned (ArmillaNusa detected):', slug);
      } 
      // PRIORITY 2: Default for Localhost for testing purposes
      else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        slug = 'armillanusa';
        console.log('DEBUG [SchoolContext] Localhost detected, defaulting to armillanusa');
      }
      // PRIORITY 3: Extract slug from platform domain (rsch.my.id)
      else if (hostname.endsWith('.rsch.my.id')) {
        const platformSuffix = 'rsch.my.id';
        const slugPart = hostname.substring(0, hostname.length - platformSuffix.length - 1);
        if (slugPart) {
          slug = slugPart.split('.')[0]; 
          console.log('DEBUG [SchoolContext] Extracted slug from platform domain:', slug);
        }
      }

      // REMOVED: Fallback matching for 'pkbm' in run.app/vercel.app to avoid repo name collisions.
      
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

      // Priority 2: Fallback to resolving by custom domain if slug lookup failed or no slug found
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
                .eq('slug', data.slug)
                .maybeSingle();
              
              const isVerified = (registration && registration.status === 'verified') || isMaster || hostname.includes('pkbmarmillanusa');

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
