/**
 * MODULE BASE DE DONNÉES CLOUD - SUPABASE REST API & LOCALSTORAGE BACKUP
 * Organisateur : AEEMCI (Sous-comité de Koumassi)
 * Événement : Formation Pratique Microsoft Word 2026 (Formateur : Tall Seydou)
 */

const SUPABASE_URL = "https://iktoigkruredsudprndu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_word_list';

/**
 * Récupère la liste complète des personnes inscrites depuis Supabase Cloud
 */
async function recupererInscriptions() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions_word?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          ticket_code: item.ticket_code || 'INSCRIPTION-PRO',
          nom: item.nom || 'Sans nom',
          email: item.email || '',
          whatsapp: item.whatsapp || '',
          statut: item.statut || 'Participant',
          niveau: item.niveau || 'Débutant',
          date: item.created_at || item.date_inscription || new Date().toISOString()
        }));
      }
    }
  } catch (e) {
    console.warn("Supabase Cloud temporairement inaccessible, lecture secours LocalStorage", e);
  }

  // Stockage local de secours
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Enregistre un nouvel inscrit dans la base de données Cloud Supabase
 */
async function ajouterInscription(entry) {
  // 1. Sauvegarde locale immédiate (instantanéité)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    current.unshift(entry);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Erreur LocalStorage", e);
  }

  // 2. Insertion directe dans la base de données Cloud Supabase
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions_word`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ticket_code: entry.ticket_code || 'WORD-2026',
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut,
        niveau: entry.niveau
      })
    });

    if (response.ok) {
      console.log("✅ Inscription sauvegardée dans Supabase Cloud avec succès !");
      return true;
    } else {
      console.error("❌ Erreur réponse Supabase Cloud :", await response.text());
      return false;
    }
  } catch (err) {
    console.error("❌ Erreur connexion Supabase Cloud :", err);
    return false;
  }
}
