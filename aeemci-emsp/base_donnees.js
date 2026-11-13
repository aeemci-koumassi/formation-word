/**
 * COUCHE DE DONNÉES & SYNCHRONISATION (base_donnees.js)
 * Section AEEMCI EMSP Abidjan — Recensement & Gestion des Membres
 */

const LOCAL_STORAGE_MEMBRES_KEY = 'aeemci_emsp_membres_cache';
const LOCAL_STORAGE_MON_MATRICULE_KEY = 'aeemci_emsp_mon_matricule';

/**
 * Génère un identifiant / matricule officiel unique pour chaque membre de l'EMSP
 * Format : MEM-EMSP-26-XXXX (ex : MEM-EMSP-26-K9P3)
 */
function genererMatriculeMembre() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MEM-EMSP-26-${rand}`;
}

/**
 * Nettoie et formate un numéro de téléphone international
 */
function formaterNumeroTelephone(numStr) {
  if (!numStr) return '';
  let clean = String(numStr).trim().replace(/[^\d+]/g, '');
  if (!clean.startsWith('+')) {
    let digits = clean.replace(/\D/g, '');
    if (digits.startsWith('00225')) digits = digits.slice(5);
    if (!digits.startsWith('225') && (digits.length === 10 || digits.length === 8)) {
      clean = '+225' + digits;
    } else if (digits.startsWith('225')) {
      clean = '+' + digits;
    } else {
      clean = '+' + digits;
    }
  }
  return clean;
}

/**
 * Enregistre un nouveau membre (Supabase + LocalStorage en secours)
 */
async function enregistrerNouveauMembre(data) {
  if (!data.matricule) {
    data.matricule = genererMatriculeMembre();
  }
  data.created_at = new Date().toISOString();
  data.statut_validation = data.statut_validation || "Validé";

  // Sauvegarde locale immédiate
  sauvegarderMembreEnLocal(data);

  let successCloud = false;
  let cloudError = null;

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const { data: inserted, error } = await supabaseClient
        .from(SUPABASE_EMSP_TABLE)
        .insert([data])
        .select();

      if (!error && inserted && inserted.length > 0) {
        successCloud = true;
        data.id = inserted[0].id;
        sauvegarderMembreEnLocal(data); // mise à jour avec l'ID cloud
      } else if (error) {
        cloudError = error.message;
        console.warn("Avertissement Supabase:", error);
      }
    }
  } catch (err) {
    cloudError = err.message;
    console.warn("Erreur de connexion Supabase, utilisation du cache local:", err);
  }

  // Stocker la référence du membre actuel pour consultation de son récépissé
  try {
    localStorage.setItem(LOCAL_STORAGE_MON_MATRICULE_KEY, JSON.stringify(data));
  } catch (e) {}

  return {
    success: true,
    cloud: successCloud,
    cloudError: cloudError,
    data: data
  };
}

/**
 * Récupère tous les membres recensés
 */
async function recupererTousLesMembres() {
  let membresCloud = [];
  let cloudAccessible = false;

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const { data, error } = await supabaseClient
        .from(SUPABASE_EMSP_TABLE)
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data)) {
        membresCloud = data;
        cloudAccessible = true;
      }
    }
  } catch (err) {
    console.warn("Impossible de joindre Supabase, bascule sur le cache local:", err);
  }

  const membresLocaux = chargerMembresLocaux();

  // Si le cloud a fonctionné, fusionner avec les enregistrements locaux récents
  if (cloudAccessible) {
    const cloudMatricules = new Set(membresCloud.map(m => m.matricule));
    const pendingLocal = membresLocaux.filter(m => !cloudMatricules.has(m.matricule));
    
    // Tenter de pousser les membres locaux manquants vers le cloud en arrière-plan
    if (pendingLocal.length > 0 && typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient.from(SUPABASE_EMSP_TABLE).insert(pendingLocal).then(() => {}).catch(() => {});
    }

    const fusion = [...pendingLocal, ...membresCloud];
    mettreAJourCacheLocal(fusion);
    return fusion;
  } else {
    // Si Supabase est indisponible ou la table pas encore créée, renvoyer les données locales
    return membresLocaux;
  }
}

/**
 * Supprime un membre (par ID ou Matricule)
 */
async function supprimerMembre(item) {
  if (!item) return false;

  // Suppression locale
  let locaux = chargerMembresLocaux();
  locaux = locaux.filter(m => m.matricule !== item.matricule && m.id !== item.id);
  mettreAJourCacheLocal(locaux);

  // Suppression Cloud
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      if (item.id) {
        await supabaseClient.from(SUPABASE_EMSP_TABLE).delete().eq('id', item.id);
      } else if (item.matricule) {
        await supabaseClient.from(SUPABASE_EMSP_TABLE).delete().eq('matricule', item.matricule);
      }
    }
  } catch (err) {
    console.error("Erreur suppression Supabase:", err);
  }

  return true;
}

/* Helpers LocalStorage */
function chargerMembresLocaux() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_MEMBRES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function sauvegarderMembreEnLocal(nouveau) {
  try {
    const liste = chargerMembresLocaux();
    const index = liste.findIndex(m => m.matricule === nouveau.matricule);
    if (index >= 0) {
      liste[index] = nouveau;
    } else {
      liste.unshift(nouveau);
    }
    localStorage.setItem(LOCAL_STORAGE_MEMBRES_KEY, JSON.stringify(liste));
  } catch (e) {}
}

function mettreAJourCacheLocal(liste) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MEMBRES_KEY, JSON.stringify(liste));
  } catch (e) {}
}

function getMonDernierMatricule() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_MON_MATRICULE_KEY) || 'null');
  } catch (e) {
    return null;
  }
}
