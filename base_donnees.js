/**
 * Module de gestion de la Base de Données (base_donnees.js)
 * Synchronisation Supabase Cloud SQL & LocalStorage de secours
 */

const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_word_list';

/**
 * Récupère la liste de toutes les personnes inscrites
 * Priorité à Supabase Cloud DB, fallback sur LocalStorage
 */
async function recupererInscriptions() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('inscriptions_word')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
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
    } catch (e) {
      console.log("Supabase Cloud inaccessible, passage au stockage local", e);
    }
  }

  // Stockage local si Supabase n'est pas encore configuré
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Enregistre un nouvel inscrit dans la base de données
 */
async function ajouterInscription(entry) {
  // 1. Sauvegarde locale immédiate
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    current.unshift(entry);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.log("Erreur LocalStorage", e);
  }

  // 2. Insertion dans la base Cloud Supabase (si configurée)
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    try {
      await supabaseClient.from('inscriptions_word').insert([{
        ticket_code: entry.ticket_code,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut,
        niveau: entry.niveau
      }]);
    } catch (err) {
      console.log("Erreur Supabase insert", err);
    }
  }

  // 3. Envoi optionnel au serveur PHP backend
  try {
    const formData = new FormData();
    for (const key in entry) {
      formData.append(key, entry[key]);
    }
    await fetch('inscription.php', { method: 'POST', body: formData });
  } catch (err) {
    console.log("PHP API fallback handled");
  }
}
