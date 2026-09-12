/**
 * MODULE BASE DE DONNÉES HYBRIDE (SUPABASE CLOUD + FORMSPREE)
 * Projet : Formation Microsoft Word (AEEMCI Koumassi)
 */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xljezjko";
const SUPABASE_REST_URL = "https://iktoigkruredsudprndu.supabase.co/rest/v1/inscriptions_word";
const SUPABASE_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_word_list';

function genererCodeTicket() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TKT-WORD-${code}`;
}

/**
 * Récupère la liste complète et centralisée de tous les inscrits (Supabase Cloud).
 */
async function recupererInscriptions() {
    try {
        const response = await fetch(`${SUPABASE_REST_URL}?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
                }
                return data;
            }
        }
    } catch (err) {
        console.warn("⚠️ Mode hors-ligne Supabase, lecture du cache local", err);
    }

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
 * Enregistre un nouvel inscrit dans Supabase Cloud + Formspree + Cache Local.
 */
async function ajouterInscription(entry) {
    const ticketCode = entry.ticket_code || genererCodeTicket();
    const record = {
        ticket_code: ticketCode,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut,
        niveau: entry.niveau
    };

    // 1. Sauvegarde locale de confort (Cache)
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const current = raw ? JSON.parse(raw) : [];
            current.unshift({ ...record, date: entry.date || new Date().toISOString() });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        }
    } catch (e) {
        console.error("Erreur LocalStorage", e);
    }

    // 2. Envoi simultané vers Formspree (Email & Notifs) et Supabase (Base Cloud Admin)
    const promises = [
        // Envoi Supabase Cloud
        fetch(SUPABASE_REST_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(record)
        }).catch(err => console.error("Erreur Supabase:", err)),

        // Envoi Formspree
        fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(record)
        }).catch(err => console.error("Erreur Formspree:", err))
    ];

    await Promise.allSettled(promises);
    return true;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recupererInscriptions, ajouterInscription, genererCodeTicket };
}
