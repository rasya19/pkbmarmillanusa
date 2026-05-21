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
  const [loading, setLoading] = useState(true); // Start loading as true
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
      // Expanded list of base domains to handle .my.id and .rsch.my.id properly
      const baseDomains = ['rsch.my.id', 'my.id', 'vercel.app', 'run.app', 'web.app'];
      
      console.log('DEBUG [SchoolContext] Resolving hostname:', hostname);
      
      const isMaster = hostname === 'rsch.my.id' || 
                       hostname === 'www.rsch.my.id' || 
                       hostname.includes('localhost') || 
                       // In dev environment, we usually want to resolve a school if we can
                       (hostname.includes('run.app') && !hostname.split('.')[0].startsWith('pkbm') && !hostname.includes('ais-dev'));
      
      setIsMasterDomain(isMaster);
      
      let slug = '';
      let customDomain = '';

      // Improved slug extraction
      if (hostname.includes('rsch.my.id')) {
        const parts = hostname.split('.');
        if (parts.length > 3) slug = parts[0]; // e.g. pkbmxxx.rsch.my.id
      } else if (hostname.includes('run.app') || hostname.includes('vercel.app')) {
        // Try to find pkbm in the hostname
        const match = hostname.match(/pkbm[a-z0-0]+/i);
        if (match) slug = match[0];
      }

      if (!slug && !isMaster) {
        customDomain = hostname;
      }

      // Check if we already have a session, maybe we can resolve by profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !slug && !customDomain) {
        console.log('DEBUG [SchoolContext] No domain resolution, trying user profile...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile?.school_id) {
          console.log('DEBUG [SchoolContext] Resolved slug from profile:', profile.school_id);
          slug = profile.school_id;
        }
      }

      if (isMaster && !slug) {
        console.log('DEBUG [SchoolContext] Master domain detected');
        setLoading(false);
        return;
      }

      if (slug) {
        await setSchoolBySlug(slug);
      } else if (customDomain) {
        try {
          const { data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('custom_domain', customDomain)
            .single();
            
          if (!error && data) {
            console.log('DEBUG [SchoolContext] Found school by custom domain:', data.name);
            
            const rawStatus = data.status;
            const isStatusActive = rawStatus === undefined || rawStatus === null || 
                                  rawStatus.toLowerCase() === 'active' || 
                                  rawStatus === true || 
                                  data.is_active === true ||
                                  data.is_active === undefined;
            
            if (!isStatusActive) {
              console.warn('DEBUG [SchoolContext] Custom domain school is INACTIVE. Status:', rawStatus);
              setError('Sekolah belum aktif');
              setSchool(null);
            } else {
              // Verification check
              console.log('DEBUG [SchoolContext] Checking registration for custom domain ID:', data.id || data.slug);
              const { data: registration, error: regError } = await supabase
                .from('registrations')
                .select('status, school_name')
                .eq('school_id', data.id || data.slug)
                .maybeSingle();
              
              const isVerified = registration && registration.status === 'verified';

              if (!isVerified) {
                console.warn('DEBUG [SchoolContext] School blocked: Registration not found or invalid status');
                setIsBlocked(true);
                setError('403: Layanan Nonaktif');
                setSchool(null);
                setLoading(false);
                return;
              }
              const schoolName = registration.school_name;
              // Map DB snake_case columns to camelCase interface
              const mappedData: School = {
                ...data,
                id: data.id || data.slug, // Ensure we have an ID for updates
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
            }
          } else {
            console.warn('DEBUG [SchoolContext] No school found for custom domain:', customDomain);
            setError('Sekolah tidak ditemukan');
          }
        } catch (err) {
          console.error('Custom domain resolution error:', err);
          setError('Gagal memproses domain');
        } finally {
          setLoading(false);
        }
      } else {
        console.warn('DEBUG [SchoolContext] No slug or custom domain resolved');
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
    try {
      // First try fetching by ID (which is the slug in this project based on original code)
      let { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', normalizedSlug)
        .single();
      
      if (error) {
        // Fallback: try by slug
        ({ data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('slug', normalizedSlug)
            .single());
      }
      
      if (!error && data) {
        console.log('DEBUG [SchoolContext] Found school data:', data);

        // Verification check
        console.log('DEBUG [SchoolContext] Checking registration for slug/id:', normalizedSlug);
        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .select('status, school_name')
          .eq('school_id', normalizedSlug)
          .maybeSingle();

        console.log('DEBUG [SchoolContext] Registration lookup result:', registration, 'Error:', regError);
        
        const isVerified = registration && registration.status === 'verified';
        
        if (!isVerified) {
          console.warn('DEBUG [SchoolContext] School blocked: Registration not found or invalid status for slug:', normalizedSlug);
          setIsBlocked(true);
          setError('403: Layanan Nonaktif');
          setSchool(null);
          setLoading(false);
          return;
        }
        
        const schoolName = registration.school_name;
        
        // BYPASS LOGIC: If status is undefined (column doesn't exist) or null, default to 'active'
        const rawStatus = data.status;
        const isActiveCol = data.is_active;
        
        console.log('DEBUG [SchoolContext] Raw status from DB:', rawStatus);

        const isStatusActive = rawStatus === undefined || rawStatus === null || 
                              rawStatus.toLowerCase() === 'active' || 
                              rawStatus === true || 
                              isActiveCol === true ||
                              isActiveCol === undefined; // Bypass if column missing

        if (!isStatusActive) {
          console.warn('DEBUG [SchoolContext] School is explicitly INACTIVE. Status:', rawStatus);
          setError('Sekolah belum aktif atau belum diverifikasi');
          setSchool(null);
        } else {
          console.log('DEBUG [SchoolContext] School is RESOLVED as ACTIVE (Bypass or Valid)');
          // Map DB snake_case columns to camelCase interface
          const mappedData: School = {
            ...data,
            id: data.id || data.slug, // Ensure we have an ID for updates
            name: schoolName || data.nama || data.name, // Use name from registration if available
            accreditation: data.akreditasi || data.accreditation,
            address: data.alamat || data.address,
            adminEmail: data.adminEmail || data.admin_email,
            logoUrl: data.logoUrl || data.logo_url,
            themeColor: data.themeColor || data.theme_color,
            expiryDate: data.expiryDate || data.expiry_date,
            studentLimit: data.studentLimit || data.student_limit
          };
          setSchool(mappedData);
        }
      } else {
        console.log('DEBUG: School NOT found or error:', error);
        setSchool(null);
        setError('Sekolah tidak ditemukan');
      }
    } catch (err) {
      console.error('Fetch school error:', err);
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
