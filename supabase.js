/**
 * Configuration & Initialisation du client Supabase Cloud
 * Projet : Formation Pratique Microsoft Word (AEEMCI Koumassi)
 */

const SUPABASE_URL = "https://iktoigkruredsudprndu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";

// Création du client Supabase
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("votre-projet"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

