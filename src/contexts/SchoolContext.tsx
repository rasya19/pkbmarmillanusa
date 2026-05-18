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
      // Expanded list of base domains to handle .my.id and .rsch.my.id properly
      const baseDomains = ['rsch.my.id', 'my.id', 'vercel.app', 'run.app', 'web.app'];
      
      console.log('DEBUG [SchoolContext] Resolving hostname:', hostname);
      
      const isMaster = hostname === 'rsch.my.id' || 
                       hostname === 'www.rsch.my.id' || 
                       hostname.includes('localhost') || 
                       // Check if it's exactly the base run.app domain without a specific slug
                       (hostname.includes('run.app') && !hostname.split('.')[0].includes('pkbm'));
      
      setIsMasterDomain(isMaster);
      
      let slug = '';
      let customDomain = '';

      // Improved slug extraction: find which base domain it ends with
      let matchedBase = '';
      for (const b of baseDomains) {
        if (hostname.endsWith(`.${b}`)) {
          matchedBase = b;
          break;
        }
      }

      if (matchedBase) {
        const prefix = hostname.substring(0, hostname.length - (matchedBase.length + 1));
        const parts = prefix.split('.');
        // Slug is usually the last part of the subdomain (e.g. 'pkbmarmillanusa')
        const detectedSlug = parts[parts.length - 1];
        
        if (detectedSlug && !['www', 'master', 'ais-dev', 'ais-pre'].includes(detectedSlug)) {
          slug = detectedSlug;
          console.log('DEBUG [SchoolContext] Detected slug from subdomain:', slug, '(Base:', matchedBase, ')');
        }
      } else if (!isMaster) {
        customDomain = hostname;
        console.log('DEBUG [SchoolContext] Treating as custom domain:', customDomain);
      }

      if (isMaster) {
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
        console.log('DEBUG [SchoolContext] Found school data:', data);
        
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
