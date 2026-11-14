/**
 * CONFIGURATION SUPABASE CLOUD — SECTION AEEMCI EMSP ABIDJAN
 * Plateforme Officielle de Recensement & Gestion des Membres
 */

const SUPABASE_URL = "https://iktoigkruredsudprndu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";
const SUPABASE_EMSP_TABLE = "recensement_emsp";
const SUPABASE_BACKUP_TABLE = "inscriptions_word";

// Initialisation du client Supabase Cloud
const supabaseClient = (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
