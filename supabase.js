/**
 * Configuration & Initialisation du client Supabase Cloud
 * Projet : Formation Pratique Microsoft Word (AEEMCI Koumassi)
 */

// Remplacez les 2 valeurs ci-dessous par l'URL et la clé ANON de votre projet Supabase
const SUPABASE_URL = "https://votre-projet.supabase.co";
const SUPABASE_ANON_KEY = "votre-cle-anon-supabase";

// Création du client Supabase
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("votre-projet"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
