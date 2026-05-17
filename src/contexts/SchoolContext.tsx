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
  error: string | null;
  setSchoolBySlug: (slug: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentSchoolSlugRef = React.useRef<string | null>(null);

  useEffect(() => {
    currentSchoolSlugRef.current = school?.slug || null;
  }, [school]);

  useEffect(() => {
    const resolveByHostname = async () => {
      const hostname = window.location.hostname;
      const baseDomain = 'rsch.my.id'; 
      
      let slug = '';
      let customDomain = '';

      if (hostname.endsWith(`.${baseDomain}`)) {
        slug = hostname.replace(`.${baseDomain}`, '');
      } else if (hostname !== baseDomain && !hostname.includes('localhost') && !hostname.includes('run.app')) {
        customDomain = hostname;
      }

      if (slug) {
        setSchoolBySlug(slug);
      } else if (customDomain) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('custom_domain', customDomain)
            .single();
            
          if (!error && data) {
            // Check status here as well
            if (data.status !== 'active') {
              console.log('School inactive');
              setError('Sekolah belum aktif');
              setSchool(null);
            } else {
              setSchool(data as School);
            }
          }
        } catch (err) {
          console.error('Custom domain resolution error:', err);
        } finally {
          setLoading(false);
        }
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
    <SchoolContext.Provider value={{ school, loading, error, setSchoolBySlug }}>
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
