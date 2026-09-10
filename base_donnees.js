/**
 * Module de gestion de la Base de Données via AirTable
 * Projet : Formation Pratique Microsoft Word (AEEMCI Koumassi)
 */

const AIRTABLE_BASE_ID = "appupo2s6akdsF9II";
const AIRTABLE_API_KEY = "patw9gaTz8EPbJlEh.77d3a347121e86e840e1b9425d38a4bb5d318fa721eaca10084a0a535f3d4f9c";
const AIRTABLE_TABLE_NAME = "Inscriptions";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_word_list';

/**
 * Récupère la liste de toutes les personnes inscrites depuis AirTable
 */
async function recupererInscriptions() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.records && Array.isArray(data.records)) {
        return data.records.map(record => ({
          ticket_code: record.fields.ticket_code || 'INSCRIPTION-PRO',
          nom: record.fields.Nom || record.fields.nom || 'Inconnu',
          email: record.fields.Email || record.fields.email || 'Inconnu',
          whatsapp: record.fields.WhatsApp || record.fields.whatsapp || 'Inconnu',
          statut: record.fields.Statut || record.fields.statut || 'Participant',
          niveau: record.fields.Niveau || record.fields.niveau || 'Débutant',
          date: record.createdTime || record.fields.Date
        }));
      }
    } else {
      const errText = await response.text();
      console.error("Erreur GET AirTable:", errText);
      alert("ERREUR LECTURE AIRTABLE :\n" + errText);
    }
  } catch (e) {
    console.warn("AirTable API inaccessible", e);
    alert("ERREUR CONNEXION AIRTABLE :\n" + e.message);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Enregistre un nouvel inscrit dans AirTable
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

  // 2. Insertion dans AirTable
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Nom": entry.nom,
              "Email": entry.email,
              "WhatsApp": entry.whatsapp,
              "Statut": entry.statut,
              "Niveau": entry.niveau,
              "Date": entry.date
            }
          }
        ]
      })
    });

    if (response.ok) {
      console.log("✅ Inscription enregistrée dans AirTable avec succès !");
      return true;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur réponse AirTable :", errorText);
      alert("ERREUR AIRTABLE :\n" + errorText);
      return false;
    }
  } catch (err) {
    console.error("❌ Erreur connexion AirTable :", err);
    alert("ERREUR CONNEXION :\n" + err.message);
    return false;
  }
}
