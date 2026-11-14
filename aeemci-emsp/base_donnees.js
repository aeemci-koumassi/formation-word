/**
 * COUCHE DE DONNÉES & SYNCHRONISATION CLOUD (base_donnees.js)
 * Section AEEMCI EMSP Abidjan — Recensement & Gestion des Membres
 * 
 * Architecture Hybride Résiliente :
 * 1. Table principale : 'recensement_emsp'
 * 2. Table Cloud de compatibilité/secours : 'inscriptions_word' (active automatiquement si la table dédiée n'est pas encore créée)
 * 3. Cache local navigateur : 'localStorage'
 */

const LOCAL_STORAGE_MEMBRES_KEY = 'aeemci_emsp_membres_cache';
const LOCAL_STORAGE_MON_MATRICULE_KEY = 'aeemci_emsp_mon_matricule';

// Variable d'état global du Cloud (accessible par l'admin pour le diagnostic)
window.SUPABASE_CLOUD_STATUS = {
  connected: false,
  mode: 'offline', // 'emsp_table' | 'backup_table' | 'local_only'
  lastCheck: null,
  error: null
};

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
 * Encode les détails complets EMSP au format compatible avec la table Cloud de secours
 */
function creerBackupPayload(data) {
  const details = {
    emsp: true,
    genre: data.genre || 'Frère',
    nationalite: data.nationalite || "Côte d'Ivoire",
    date_naissance: data.date_naissance || null,
    telephone_urgence: data.telephone_urgence || '',
    cycle: data.cycle || 'Licence Professionnelle (Bac +3)',
    filiere: data.filiere || 'Tronc Commun — Licence (Semestre 1)',
    niveau: data.niveau || 'Licence 1 — Semestre 1 (Tronc Commun)',
    residence: data.residence || 'Campus EMSP (Cité Universitaire)',
    precision_residence: data.precision_residence || '',
    commissions: Array.isArray(data.commissions) ? data.commissions : [],
    competences: data.competences || '',
    remarques: data.remarques || '',
    statut_validation: data.statut_validation || 'Validé'
  };

  return {
    ticket_code: data.matricule,
    nom: data.nom,
    email: data.email || '',
    whatsapp: data.whatsapp || '',
    statut: data.statut || 'Étudiant(e) régulier(e)',
    niveau: JSON.stringify(details)
  };
}

/**
 * Décode un enregistrement de la table Cloud de secours vers un objet Membre complet
 */
function decoderBackupRow(item) {
  let extra = {};
  try {
    if (item.niveau && typeof item.niveau === 'string' && item.niveau.startsWith('{')) {
      extra = JSON.parse(item.niveau);
    }
  } catch (e) {
    extra = {};
  }

  return {
    id: item.id,
    created_at: item.created_at,
    matricule: item.ticket_code || `MEM-EMSP-26-ID${item.id}`,
    nom: item.nom || 'Membre EMSP',
    email: item.email || '',
    whatsapp: item.whatsapp || '',
    statut: item.statut || 'Étudiant(e) régulier(e)',
    genre: extra.genre || 'Frère',
    nationalite: extra.nationalite || "Côte d'Ivoire",
    date_naissance: extra.date_naissance || null,
    telephone_urgence: extra.telephone_urgence || '',
    cycle: extra.cycle || 'Licence Professionnelle (Bac +3)',
    filiere: extra.filiere || 'Tronc Commun — Licence (Semestre 1)',
    niveau: extra.niveau || 'Licence 1 — Semestre 1 (Tronc Commun)',
    residence: extra.residence || 'Campus EMSP (Cité Universitaire)',
    precision_residence: extra.precision_residence || '',
    commissions: Array.isArray(extra.commissions) ? extra.commissions : [],
    competences: extra.competences || '',
    remarques: extra.remarques || '',
    statut_validation: extra.statut_validation || 'Validé',
    _source: 'cloud_backup'
  };
}

/**
 * Enregistre un nouveau membre (Supabase avec double fallback Cloud + Local)
 */
async function enregistrerNouveauMembre(data) {
  if (!data.matricule) {
    data.matricule = genererMatriculeMembre();
  }
  data.created_at = new Date().toISOString();
  data.statut_validation = data.statut_validation || "Validé";

  // 1. Sauvegarde locale immédiate (confort & réactivité instantanée)
  sauvegarderMembreEnLocal(data);

  let successCloud = false;
  let cloudModeUtilise = 'none';
  let cloudError = null;

  // 2. Synchronisation Cloud Supabase
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    // A) Tentative vers la table principale dédiée 'recensement_emsp'
    try {
      const { data: inserted, error } = await supabaseClient
        .from(SUPABASE_EMSP_TABLE)
        .insert([data])
        .select();

      if (!error && inserted && inserted.length > 0) {
        successCloud = true;
        cloudModeUtilise = 'emsp_table';
        data.id = inserted[0].id;
        sauvegarderMembreEnLocal(data);
      } else {
        cloudError = error ? (error.message || JSON.stringify(error)) : 'Insert vide';
      }
    } catch (err) {
      cloudError = err.message;
    }

    // B) Si la table dédiée échoue (ex: table non créée dans le dashboard Supabase),
    // on bascule AUTOMATIQUEMENT et TRANSPAREMMENT vers la table Cloud de secours active
    if (!successCloud && typeof SUPABASE_BACKUP_TABLE !== 'undefined') {
      try {
        const backupRow = creerBackupPayload(data);
        const { data: bInserted, error: bError } = await supabaseClient
          .from(SUPABASE_BACKUP_TABLE)
          .insert([backupRow])
          .select();

        if (!bError && bInserted && bInserted.length > 0) {
          successCloud = true;
          cloudModeUtilise = 'backup_table';
          data.id = bInserted[0].id;
          data._source = 'cloud_backup';
          sauvegarderMembreEnLocal(data);
          cloudError = null;
        } else if (bError) {
          console.warn("Échec secours Cloud:", bError);
        }
      } catch (errB) {
        console.warn("Exception secours Cloud:", errB);
      }
    }
  }

  // Stocker la référence du membre actuel pour consultation de son récépissé
  try {
    localStorage.setItem(LOCAL_STORAGE_MON_MATRICULE_KEY, JSON.stringify(data));
  } catch (e) {}

  window.SUPABASE_CLOUD_STATUS = {
    connected: successCloud,
    mode: cloudModeUtilise,
    lastCheck: new Date().toISOString(),
    error: cloudError
  };

  return {
    success: true,
    cloud: successCloud,
    mode: cloudModeUtilise,
    cloudError: cloudError,
    data: data
  };
}

/**
 * Récupère tous les membres recensés en interrogeant les deux sources Cloud Supabase
 */
async function recupererTousLesMembres() {
  let membresCloud = [];
  let cloudAccessible = false;
  let detectedMode = 'local_only';

  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    // 1. Lire la table dédiée 'recensement_emsp'
    try {
      const { data, error } = await supabaseClient
        .from(SUPABASE_EMSP_TABLE)
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data)) {
        membresCloud = data.map(m => ({ ...m, _source: 'emsp_table' }));
        cloudAccessible = true;
        detectedMode = 'emsp_table';
      }
    } catch (err) {
      console.warn("Table recensement_emsp inaccessible:", err);
    }

    // 2. Lire AUSSI la table de secours 'inscriptions_word' (filtrée pour EMSP)
    if (typeof SUPABASE_BACKUP_TABLE !== 'undefined') {
      try {
        const { data: bData, error: bError } = await supabaseClient
          .from(SUPABASE_BACKUP_TABLE)
          .select('*')
          .like('ticket_code', 'MEM-EMSP%')
          .order('id', { ascending: false });

        if (!bError && Array.isArray(bData) && bData.length > 0) {
          const decodedBackup = bData.map(decoderBackupRow);
          
          // Fusionner avec déduplication par matricule
          const existingMatricules = new Set(membresCloud.map(m => m.matricule));
          for (const item of decodedBackup) {
            if (!existingMatricules.has(item.matricule)) {
              membresCloud.push(item);
              existingMatricules.add(item.matricule);
            }
          }
          cloudAccessible = true;
          if (detectedMode === 'local_only') {
            detectedMode = 'backup_table';
          }
        }
      } catch (errB) {
        console.warn("Table de secours Supabase inaccessible:", errB);
      }
    }
  }

  window.SUPABASE_CLOUD_STATUS = {
    connected: cloudAccessible,
    mode: detectedMode,
    lastCheck: new Date().toISOString(),
    count: membresCloud.length
  };

  const membresLocaux = chargerMembresLocaux();

  // Si le cloud a fonctionné, fusionner avec les enregistrements locaux
  if (cloudAccessible) {
    const cloudMatricules = new Set(membresCloud.map(m => m.matricule));
    const pendingLocal = membresLocaux.filter(m => !cloudMatricules.has(m.matricule));
    
    // Tenter de pousser les membres locaux manquants vers le cloud en arrière-plan
    if (pendingLocal.length > 0 && typeof supabaseClient !== 'undefined' && supabaseClient) {
      for (const p of pendingLocal) {
        enregistrerNouveauMembre(p).catch(() => {});
      }
    }

    const fusion = [...pendingLocal, ...membresCloud];
    mettreAJourCacheLocal(fusion);
    return fusion;
  } else {
    // Si Supabase est hors-ligne, renvoyer les données locales
    return membresLocaux;
  }
}

/**
 * Supprime un membre (par ID ou Matricule) sur toutes les sources
 */
async function supprimerMembre(item) {
  if (!item) return false;

  // 1. Suppression locale
  let locaux = chargerMembresLocaux();
  locaux = locaux.filter(m => m.matricule !== item.matricule && m.id !== item.id);
  mettreAJourCacheLocal(locaux);

  // 2. Suppression Cloud
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      // De la table principale
      if (item._source === 'emsp_table' || !item._source) {
        if (item.id) {
          await supabaseClient.from(SUPABASE_EMSP_TABLE).delete().eq('id', item.id);
        } else if (item.matricule) {
          await supabaseClient.from(SUPABASE_EMSP_TABLE).delete().eq('matricule', item.matricule);
        }
      }
      
      // De la table de secours
      if (item._source === 'cloud_backup' || item.matricule) {
        await supabaseClient.from(SUPABASE_BACKUP_TABLE).delete().eq('ticket_code', item.matricule);
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
