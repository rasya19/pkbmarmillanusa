// src/utils/tierConfig.ts

export interface TierFeatures {
  maxSiswa: number;
  maxGuru: number;
  bisaCustomDomain: boolean;
  bisaPakaiGeminiAI: boolean;
  aksesRaporKM: boolean;
  keuanganMultiPos: boolean;     
  keuanganOtomatisTagihan: boolean; 
  keuanganPaymentGateway: boolean;  
}

export const PAKET_LMS_CONFIG: Record<string, TierFeatures> = {
  Silver: {
    maxSiswa: 150,
    maxGuru: 15,
    bisaCustomDomain: false,
    bisaPakaiGeminiAI: false,
    aksesRaporKM: true,
    keuanganMultiPos: false,
    keuanganOtomatisTagihan: false,
    keuanganPaymentGateway: false,
  },
  Gold: {
    maxSiswa: 500,
    maxGuru: 50,
    bisaCustomDomain: true,
    bisaPakaiGeminiAI: false, 
    aksesRaporKM: true,
    keuanganMultiPos: true,
    keuanganOtomatisTagihan: true,
    keuanganPaymentGateway: false,
  },
  Platinum: {
    maxSiswa: 9999, 
    maxGuru: 999,
    bisaCustomDomain: true,
    bisaPakaiGeminiAI: true, 
    aksesRaporKM: true,
    keuanganMultiPos: true,
    keuanganOtomatisTagihan: true,
    keuanganPaymentGateway: true, 
  }
};
