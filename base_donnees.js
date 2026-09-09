/**
 * Module de gestion de la Base de Données (base_donnees.js)
 * Interconnexion Directe Supabase Cloud Database + LocalStorage Backup
 * Projet : Formation Pratique Microsoft Word (AEEMCI Koumassi)
 */

const SUPABASE_URL = "https://iktoigkruredsudprndu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_word_list';

/**
 * Récupère la liste de toutes les personnes inscrites
 * Priorité à Supabase Cloud DB via API REST directe, fallback sur LocalStorage
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
      if (Array.isArray(data) && data.length > 0) {
        return data.map(item => ({
          ticket_code: item.ticket_code,
          nom: item.nom,
          email: item.email,
          whatsapp: item.whatsapp,
          statut: item.statut,
          niveau: item.niveau,
          date: item.created_at || item.date_inscription
        }));
      }
    }
  } catch (e) {
    console.warn("Supabase API inaccessible, passage au stockage local", e);
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
  // 1. Sauvegarde locale immédiate
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    current.unshift(entry);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Erreur LocalStorage", e);
  }

  // 2. Insertion directe dans la base Cloud Supabase
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
        ticket_code: entry.ticket_code || 'INSCRIPTION-PRO',
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut,
        niveau: entry.niveau
      })
    });

    if (response.ok) {
      console.log("✅ Inscription enregistrée dans Supabase avec succès !");
    } else {
      console.error("❌ Erreur réponse Supabase :", await response.text());
    }
  } catch (err) {
    console.error("❌ Erreur connexion Supabase :", err);
  }
}
