import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Pedagogical Dialog Feedback via Gemini AI (Kurikulum Merdeka)
  app.post("/api/generate-narasi", async (req, res) => {
    const { mapel, uts, uas, tugas, rata, predikat } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY belum dikonfigurasi di panel Settings > Secrets Anda."
      });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Buatlah narasi capaian kompetensi (Kurikulum Merdeka) singkat, profesional, dan menyemangati dalam Bahasa Indonesia untuk siswa dengan data mata pelajaran berikut:
Mata Pelajaran: ${mapel || 'Mata Pelajaran'}
Nilai UTS: ${uts || 0}
Nilai UAS: ${uas || 0}
Nilai Tugas: ${tugas || 0}
Nilai Rata-Rata: ${rata || 0}
Predikat Kelulusan: ${predikat || 'Baik'}

Berikan deskripsi objektif tentang apa saja yang telah dikuasai dengan baik oleh siswa dan saran konkret yang konstruktif untuk meningkatkan performa belajarnya ke depan secara berimbang dan ringkas (maksimal 3 kalimat). Jangan menyertakan kata sambutan, salam pembuka, atau penutup. Langsung berikan narasi kompetensinya saja.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const text = response.text || "";
      res.json({ success: true, text: text.trim() });
    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      res.status(500).json({ success: false, message: err?.message || "Internal server error during Gemini execution." });
    }
  });

  // Supabase Admin Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // API Route for Seeding
  app.post("/api/seed-demo", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        success: false, 
        message: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di Environment Variables." 
      });
    }

    try {
      const demoUsers = [
        { email: 'silver@demo.com', plan: 'Silver' },
        { email: 'gold@demo.com', plan: 'Gold' },
        { email: 'platinum@demo.com', plan: 'Platinum' }
      ];

      const password = 'DemoAccount123!';

      for (const user of demoUsers) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === user.email);

        if (existingUser) {
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: password,
          email_confirm: true
        });

        if (authError) throw authError;

        if (authData.user) {
          await supabaseAdmin
            .from('profiles')
            .upsert({ 
              id: authData.user.id,
              email: user.email,
              subscription_plan: user.plan,
              updated_at: new Date()
            }, { onConflict: 'id' });
        }
      }

      res.json({ success: true, message: "3 Akun Demo Berhasil Disiapkan!" });

    } catch (error: any) {
      console.error("Seeding error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // API Route untuk Menghapus Registrasi + Domain Vercel
  app.delete("/api/delete-registration/:id", async (req, res) => {
    const { id } = req.params;
    const { createClient } = await import("@supabase/supabase-js");
    const axios = (await import("axios")).default;

    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, message: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi." });
      }

      // 1. Ambil data subdomain
      const { data: registration } = await supabaseAdmin
        .from('registrations')
        .select('subdomain, school_name')
        .eq('id', id)
        .single();
      
      if (!registration) {
        return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
      }

      const domainName = `${registration.subdomain || registration.school_name.toLowerCase().replace(/ /g, '-')}.rsch.my.id`;

      // 2. Hapus Supabase
      await supabaseAdmin.from('registrations').delete().eq('id', id);

      // 3. Hapus Vercel
      if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
        try {
          const teamId = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
          await axios.delete(
            `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domainName}${teamId}`,
            { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` } }
          );
        } catch (e) { console.error("Vercel Delete Error:", e); }
      }

      res.json({ success: true, message: `Registrasi ${domainName} telah dihapus.` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
