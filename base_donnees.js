/**
 * MODULE BASE DE DONNÉES HYBRIDE (SUPABASE CLOUD + FORMSPREE)
 * Projet : Double Formation Excel & Prompt Engineering (AEEMCI Koumassi)
 * Session : Dimanche 04 Octobre 2026
 */

let FORMSPREE_ENDPOINT = "https://formspree.io/f/xljezjko";
const SUPABASE_PRIMARY_URL = "https://iktoigkruredsudprndu.supabase.co/rest/v1/inscriptions_excel_ia";
const SUPABASE_FALLBACK_URL = "https://iktoigkruredsudprndu.supabase.co/rest/v1/inscriptions_word";
const SUPABASE_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_octobre_2026_v2';

const MAX_CAPACITE = 300;

function genererCodeTicket() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TKT-EXCEL-IA-${code}`;
}

/**
 * Récupère uniquement la liste des inscrits de la NOUVELLE formation (04 Octobre 2026).
 * Exclut complètement l'ancienne base de données Word.
 */
async function recupererInscriptions() {
    // 1. Essai sur la nouvelle table Supabase (inscriptions_excel_ia)
    try {
        const response = await fetch(`${SUPABASE_PRIMARY_URL}?select=*&order=created_at.desc`, {
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
        console.warn("⚠️ Nouvelle table Supabase non accessible, passage en mode filtre/fallback", err);
    }

    // 2. Fallback avec filtre strict sur la date (Uniquement > 28/09/2026)
    try {
        const response = await fetch(`${SUPABASE_FALLBACK_URL}?select=*&created_at=gte.2026-09-28T00:00:00Z&order=created_at.desc`, {
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
                // Filtrer strictement les nouvelles inscriptions
                const cleanData = data.filter(estInscriptionNouvelleSession);
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanData));
                }
                return cleanData;
            }
        }
    } catch (err) {
        console.warn("⚠️ Mode hors-ligne Supabase", err);
    }

    // 3. Fallback LocalStorage propre
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
 * Vérifie si une inscription appartient à la NOUVELLE formation (04 Octobre 2026).
 */
function estInscriptionNouvelleSession(item) {
    if (!item) return false;
    const f = (item.niveau || item.formation || '').toLowerCase();
    const dateStr = item.created_at || item.date;
    const isNewDate = dateStr && new Date(dateStr) >= new Date('2026-09-28T00:00:00Z');
    return f.includes('excel') || f.includes('prompt') || f.includes('deux') || isNewDate;
}

/**
 * Compte uniquement les inscrits de la NOUVELLE formation (Excel & Prompt Engineering - Octobre 2026).
 */
async function obtenirNombreInscrits() {
    try {
        const list = await recupererInscriptions();
        if (!Array.isArray(list)) return 0;
        
        // Filtre les inscriptions liées à la nouvelle formation
        return list.filter(estInscriptionNouvelleSession).length;
    } catch (e) {
        return 0;
    }
}

/**
 * Enregistre un nouvel inscrit directement.
 */
async function ajouterInscription(entry) {
    const list = await recupererInscriptions();
    
    // Normalisation pour vérification anti-doublon
    const cleanEmail = (entry.email || '').trim().toLowerCase();
    const cleanPhone = (entry.whatsapp || '').replace(/\D/g, '');

    const existant = list.find(item => {
        const itemEmail = (item.email || '').trim().toLowerCase();
        const itemPhone = (item.whatsapp || '').replace(/\D/g, '');
        return (cleanEmail && itemEmail === cleanEmail) || (cleanPhone && cleanPhone.length >= 8 && itemPhone === cleanPhone);
    });

    const totalCurrent = await obtenirNombreInscrits();

    if (existant) {
        console.log("ℹ️ Inscription déjà enregistrée (Doublon bloqué) :", existant);
        return { 
            success: true, 
            estDoublon: true, 
            existingRecord: existant 
        };
    }

    const ticketCode = entry.ticket_code || genererCodeTicket();
    const record = {
        ticket_code: ticketCode,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut,
        genre: entry.genre || 'Non spécifié',
        age: entry.age || '',
        ordi: entry.ordi || 'Non précisé',
        attentes: entry.attentes || '',
        niveau: entry.formation || entry.niveau || 'Les deux formations',
        statut_validation: entry.statut_validation || "Liste d'attente"
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

    // 2. Envoi simultané vers Formspree et Supabase Cloud
    const postToSupabase = async (url) => {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(record)
            });
            if (!res.ok && url === SUPABASE_PRIMARY_URL) {
                // Fallback vers table secondaire
                return fetch(SUPABASE_FALLBACK_URL, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(record)
                });
            }
            return res;
        } catch (e) {
            console.error("Erreur Supabase:", e);
        }
    };

    const promises = [
        postToSupabase(SUPABASE_PRIMARY_URL),

        fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ ...record, type_inscription: "Double Formation Excel & Prompt Engineering (04 Octobre)" })
        }).catch(err => console.error("Erreur Formspree:", err))
    ];

    await Promise.allSettled(promises);
    return { success: true, estDoublon: false, totalCount: totalCurrent + 1 };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recupererInscriptions, obtenirNombreInscrits, ajouterInscription, genererCodeTicket, MAX_CAPACITE };
}
