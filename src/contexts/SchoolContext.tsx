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
  setSchoolBySlug: (slug: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true
  const [error, setError] = useState<string | null>(null);
  const [isMasterDomain, setIsMasterDomain] = useState(false);
  
  const currentSchoolSlugRef = React.useRef<string | null>(null);

  useEffect(() => {
    currentSchoolSlugRef.current = school?.slug || null;
  }, [school]);

  useEffect(() => {
    const resolveByHostname = async () => {
      const hostname = window.location.hostname.toLowerCase().trim();
      const baseDomain = 'rsch.my.id'; 
      
      console.log('DEBUG [SchoolContext] Resolving hostname:', hostname);
      
      const isMaster = hostname === baseDomain || 
                       hostname === `www.${baseDomain}` || 
                       hostname.includes('localhost') || 
                       hostname.includes('run.app') ||
                       hostname.includes('web.app') ||
                       hostname.includes('vercel.app');
      
      setIsMasterDomain(isMaster);
      
      if (isMaster) {
        console.log('DEBUG [SchoolContext] Master domain detected');
        setLoading(false);
        return;
      }

      let slug = '';
      let customDomain = '';

      if (hostname.endsWith(`.${baseDomain}`)) {
        // Extract subdomain parts
        const prefix = hostname.substring(0, hostname.length - (baseDomain.length + 1));
        const parts = prefix.split('.');
        // Take the last part as the slug (e.g., from 'www.pkbmarmillanusa', take 'pkbmarmillanusa')
        const detectedSlug = parts[parts.length - 1];
        
        if (detectedSlug && detectedSlug !== 'www' && detectedSlug !== 'master') {
          slug = detectedSlug;
          console.log('DEBUG [SchoolContext] Detected slug from subdomain:', slug);
        }
      } else {
        customDomain = hostname;
        console.log('DEBUG [SchoolContext] Treating as custom domain:', customDomain);
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
            if (data.status !== 'active') {
              setError('Sekolah belum aktif');
              setSchool(null);
            } else {
              setSchool(data as School);
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
        console.log('DEBUG: School data found:', data);
        if (data.status !== 'active') {
          console.log('School inactive');
          setError('Sekolah belum aktif atau belum diverifikasi');
          setSchool(null);
        } else {
          setSchool(data as School);
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
    <SchoolContext.Provider value={{ school, loading, isMasterDomain, error, setSchoolBySlug }}>
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
