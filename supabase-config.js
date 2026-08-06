/* ==========================================================================
   FLEVA — Supabase connection settings
   Paste your own Project URL and anon/public key here (Supabase dashboard →
   Settings → API). The "anon" key is safe to use in frontend code — it's
   designed to be public, and the database rules (see supabase-schema.sql)
   control what it's allowed to do.
   ========================================================================== */

const SUPABASE_URL = "https://wajsqtsyloiiohnydfnp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6lJRcLJuChQSH-G3__MTwQ_QWlW54nf";

if(SUPABASE_URL.includes("PASTE_") || SUPABASE_ANON_KEY.includes("PASTE_")){
  console.warn("FLEVA: Supabase isn't configured yet — open supabase-config.js and paste in your Project URL and anon key from Supabase → Settings → API.");
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
