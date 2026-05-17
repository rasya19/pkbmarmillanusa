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
        // 1. Delete old user if exists (to be clean)
        // Note: auth.admin.listUsers might be slow or pagination heavy, 
        // so we try to find by email first or just delete if we have ID.
        // For simplicity, we just try to create. If it exists, we update.
        
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === user.email);

        if (existingUser) {
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        }

        // 2. Create User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: password,
          email_confirm: true
        });

        if (authError) throw authError;

        if (authData.user) {
          // 3. Update Profile
          // We assume a 'profiles' table exists that is linked to 'auth.users' via 'id'
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({ 
              id: authData.user.id,
              email: user.email,
              subscription_plan: user.plan,
              updated_at: new Date()
            }, { onConflict: 'id' });

          if (profileError) {
             console.warn(`Gagal update profil untuk ${user.email}. Pastikan tabel 'profiles' memiliki kolom 'subscription_plan'.`, profileError);
          }
        }
      }

      res.json({ success: true, message: "3 Akun Demo Berhasil Disiapkan!" });

    } catch (error: any) {
      console.error("Seeding error:", error);
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
