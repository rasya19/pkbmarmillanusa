import React, { useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
  showPlaceholder?: boolean;
}

export default function AdBanner({ slot, format = 'horizontal', className, showPlaceholder = false, type = 'native' }: AdBannerProps & { type?: 'native' | 'placeholder' }) {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    if (type !== 'native' || showPlaceholder) return;

    const scriptSrc = 'https://pl29339314.profitablecpmratenetwork.com/fd27bd756540b7cd127cda4f8656621d/invoke.js';
    
    // Check if script already exists to avoid duplicate loads
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = scriptSrc;
      document.body.appendChild(script);
    }
  }, [type, showPlaceholder]);

  if (showPlaceholder || type === 'placeholder') {
    return (
      <div className={`bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 min-h-[100px] overflow-hidden group hover:border-brand-accent/30 transition-colors ${className}`}>
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-brand-accent transition-colors mb-2">
          <DollarSign className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Ruang Iklan (Ads Area)</span>
        </div>
        <div className="w-full h-12 bg-slate-100 rounded-lg mb-4" />
        <p className="text-[8px] text-slate-400 uppercase font-medium tracking-tighter opacity-50">Slot: {slot || 'General'}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div id="container-fd27bd756540b7cd127cda4f8656621d" className="flex justify-center items-center overflow-hidden min-h-[50px] w-full"></div>
      <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest mt-1 opacity-20">Slot: {slot || 'General'}</p>
    </div>
  );
}
