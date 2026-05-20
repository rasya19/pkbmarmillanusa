import express from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

/**
 * CONFIGURATION & ENVIRONMENT SETUP:
 * 
 * Anda harus memasukkan nilai token dan ID berikut ke dalam file .env di server lokal Anda 
 * atau konfigurasi "Environment Variables" di platform deployment Anda (Vercel/Cloud Run):
 * 
 * 1. VERCEL_TOKEN        : Dapatkan Token Akses pribadi Anda di dashboard Vercel:
 *                          -> Masuk ke Akun Vercel
 *                          -> Klik avatar profil Anda -> Settings -> Tokens
 *                          -> Buat token baru dengan scope "Full Access"
 *                          -> Masukkan nilainya ke env dengan kunci: VERCEL_TOKEN
 * 
 * 2. VERCEL_PROJECT_ID   : Ambil Project ID aplikasi web Anda di dashboard Vercel:
 *                          -> Buka proyek Anda di Vercel
 *                          -> Masuk ke menu Settings -> General
 *                          -> Cari bagian "Project ID" (berupa string unik acak)
 *                          -> Masukkan nilainya ke env dengan kunci: VERCEL_PROJECT_ID
 * 
 * 3. VERCEL_TEAM_ID      : Optional (Hanya jika proyek Anda dideploy di akun Vercel Team/Lembaga):
 *                          -> Buka Team Settings di Vercel
 *                          -> Salin ID Tim Anda yang muncul atau nama slug tim Anda
 *                          -> Masukkan nilainya ke env dengan kunci: VERCEL_TEAM_ID
 *                          -> Jika Akum Vercel Anda adalah Personal, kosongkan / biarkan kosong.
 * 
 * 4. SUPABASE_SERVICE_ROLE_KEY & VITE_SUPABASE_URL:
 *                          -> Diambil dari Dashboard Supabase -> Project Settings -> API
 *                          -> Gunakan kunci "service_role" (bypass RLS) agar backend dapat menghapus data registrasi secara aman.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

app.delete('/api/delete-registration/:id', async (req, res) => {
  const { id } = req.params;

  console.log(`[BACKEND API] Memulai proses penghapusan pendaftaran ID: ${id}`);

  try {
    if (!supabaseAdmin) {
      throw new Error("Klien Supabase Admin belum terinisialisasi. Periksa konfigurasi SUPABASE_SERVICE_ROLE_KEY.");
    }

    // 1. Ambil data pendaftar sebelum melancarkan aksi hapus untuk mendapatkan rincian domain
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !registration) {
      console.warn(`[BACKEND API] Registrasi ID ${id} tidak ditemukan di database Supabase.`);
      return res.status(404).json({ 
        success: false, 
        message: "Data pendaftaran tidak ditemukan atau sudah dihapus." 
      });
    }

    // 2. Kumpulkan semua kemungkinan domain/subdomain yang terhubung ke Vercel agar pembersihan 100% tuntas
    const domainsToDelete: string[] = [];
    
    // a. Subdomain berdasarkan kolom 'slug'
    if (registration.slug) {
      domainsToDelete.push(`${registration.slug.toLowerCase().trim()}.rsch.my.id`);
    }

    // b. Subdomain berdasarkan kolom 'subdomain' atau 'subdomain_prefix' jika tersedia
    if (registration.subdomain) {
      const sub = registration.subdomain.toLowerCase().trim();
      // Bila menyimpan nama domain lengkap
      if (sub.includes('.')) {
        domainsToDelete.push(sub);
      } else {
        domainsToDelete.push(`${sub}.rsch.my.id`);
      }
    }
    if (registration.subdomain_prefix) {
      domainsToDelete.push(`${registration.subdomain_prefix.toLowerCase().trim()}.rsch.my.id`);
    }

    // c. Fallback subdomain berdasarkan 'school_name' yang disinkronkan dengan landing page
    if (registration.school_name) {
      const sanitizedSchoolName = registration.school_name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      domainsToDelete.push(`${sanitizedSchoolName}.rsch.my.id`);
    }

    // Saring list domain agar tidak ada entri duplikat dan menghapus string kosong
    const uniqueDomains = Array.from(new Set(domainsToDelete)).filter(Boolean);

    console.log(`[BACKEND API] Daftar domain terdeteksi untuk diputus dari Vercel:`, uniqueDomains);

    // 3. HAPUS REGISTRASI dari database Supabase (dilakukan terlebih dahulu secara permanen)
    const { error: deleteError } = await supabaseAdmin
      .from('registrations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(`[BACKEND API] Database Error saat menghapus:`, deleteError);
      throw new Error(`Gagal menghapus data dari tabel registrations di Supabase: ${deleteError.message}`);
    }

    console.log(`[BACKEND API] Sukses menghapus registrasi ID ${id} dari database.`);

    // 4. PUTUSKAN DOMAIN-DOMAIN dari Dashboard Vercel menggunakan API resmi Vercel
    const vercelResults: Array<{ domain: string; status: 'SUCCESS' | 'SKIPPED' | 'FAILED'; detail: string }> = [];

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      console.warn("[BACKEND API] Peringatan: Kunci VERCEL_TOKEN atau VERCEL_PROJECT_ID tidak lengkap di Environment Variables. Langkah pencabutan domain Vercel dilewati.");
      
      uniqueDomains.forEach(domain => {
        vercelResults.push({
          domain,
          status: 'SKIPPED',
          detail: 'Environment Variables Vercel belum dikonfigurasi lengkap.'
        });
      });
    } else {
      // Loop tiap domain unik untuk di-DELETE dari Vercel
      for (const dom of uniqueDomains) {
        try {
          // Siapkan parameter query Vercel Team jika diperlukan
          const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
          const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${dom}${teamQuery}`;

          console.log(`[BACKEND API] Menembak DELETE ke Vercel API untuk domain: ${dom}`);
          
          await axios.delete(url, {
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
            },
            timeout: 8000 // Batas maksimal respons 8 detik per domain
          });

          console.log(`[BACKEND API] Domain ${dom} BERHASIL dihapus dari Vercel.`);
          vercelResults.push({
            domain: dom,
            status: 'SUCCESS',
            detail: 'Domain berhasil dicabut dari project Vercel secara otomatis.'
          });
        } catch (vercelErr: any) {
          const errMsg = vercelErr.response?.data?.error?.message || vercelErr.message;
          const errCode = vercelErr.response?.data?.error?.code || 'ERROR';

          console.error(`[BACKEND API] Gagal menghapus domain ${dom} dari Vercel:`, errMsg);
          
          // Domain tidak ada di Vercel, kita anggap sukses karena memang tujuannya sudah tidak ada
          if (errCode === 'not_found' || vercelErr.response?.status === 404) {
            vercelResults.push({
              domain: dom,
              status: 'SUCCESS',
              detail: 'Domain sudah tidak terdaftar di Vercel (clean).'
            });
          } else {
            vercelResults.push({
              domain: dom,
              status: 'FAILED',
              detail: `Gagal mencabut domain: ${errMsg}`
            });
          }
        }
      }
    }

    // 5. Kembalikan respons sukses ke frontend dengan detail lengkap pendeleasian aksi
    return res.status(200).json({
      success: true,
      message: `Sekolah '${registration.school_name || id}' berhasil dihapus permanen dari registrasi database.`,
      deletedId: id,
      vercelAction: vercelResults,
      activeDomainsRemoved: uniqueDomains
    });

  } catch (error: any) {
    console.error("[BACKEND API] CRITICAL ERROR pada handler delete-registration:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi galat internal server saat memproses permintaan penghapusan."
    });
  }
});

// Menyediakan handler export yang kompatibel dengan Vercel Serverless Function & Express local dev server
export default app;
