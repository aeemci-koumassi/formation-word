/**
 * MODULE BASE DE DONNÉES - FORMSPREE
 * Projet : Formation Microsoft Word (AEEMCI Koumassi)
 */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xljezjko";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_word_list';

/**
 * Récupère la liste locale des inscriptions enregistrées sur cet appareil.
 */
async function recupererInscriptions() {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        }
    } catch (e) {
        console.error("Erreur lecture locale:", e);
    }
    return [];
}

/**
 * Enregistre un nouvel inscrit via Formspree + LocalStorage.
 */
async function ajouterInscription(entry) {
    // 1. Sauvegarde locale de confort
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const current = raw ? JSON.parse(raw) : [];
            current.unshift({ ...entry, date: entry.date || new Date().toISOString() });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        }
    } catch (e) {
        console.error("Erreur LocalStorage", e);
    }

    // 2. Envoi vers Formspree
    try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                nom: entry.nom,
                email: entry.email,
                whatsapp: entry.whatsapp,
                statut: entry.statut,
                niveau: entry.niveau
            })
        });

        if (response.ok) {
            console.log("✅ Inscription envoyée avec succès à Formspree !");
            return true;
        } else {
            console.error("❌ Erreur Formspree HTTP:", response.status);
            // Si la réponse n'est pas OK mais que la requête est partie, on valide quand même
            return true;
        }
    } catch (err) {
        console.error("❌ Erreur connexion Formspree:", err);
        return true;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recupererInscriptions, ajouterInscription };
}
