/**
 * MODULE BASE DE DONNÉES HYBRIDE (SUPABASE CLOUD + FORMSPREE)
 * Projet : Double Formation Excel & Prompt Engineering (AEEMCI Koumassi)
 * Session : Dimanche 04 Octobre 2026
 */

let FORMSPREE_ENDPOINT = "https://formsubmit.co/ajax/koumayaya7@gmail.com";
const SUPABASE_PRIMARY_URL = "https://iktoigkruredsudprndu.supabase.co/rest/v1/inscriptions_word";
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

function parseSupabaseItem(item) {
    if (!item) return item;
    const rawNiveau = item.niveau || '';
    if (rawNiveau.includes('| Genre:')) {
        const parts = rawNiveau.split('|').map(s => s.trim());
        item.niveau = parts[0] || 'Les deux formations';
        parts.forEach(part => {
            if (part.startsWith('Genre:')) item.genre = item.genre || part.replace('Genre:', '').trim();
            if (part.startsWith('Âge:') || part.startsWith('Age:')) item.age = item.age || part.replace(/Âge:|Age:/, '').trim();
            if (part.startsWith('Ordi:')) item.ordi = item.ordi || part.replace('Ordi:', '').trim();
            if (part.startsWith('Attentes:')) item.attentes = item.attentes || part.replace('Attentes:', '').trim();
        });
    }
    return item;
}

/**
 * Récupère l'ensemble des inscrits depuis Supabase Cloud (sans limite ni tronquage par date).
 */
async function recupererInscriptions() {
    // 1. Essai sur la table Supabase active (inscriptions_word) avec contournement strict du cache navigateur
    try {
        const response = await fetch(`${SUPABASE_PRIMARY_URL}?select=*&limit=5000&order=created_at.desc&_t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                const parsed = data.map(parseSupabaseItem);
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
                }
                return parsed;
            }
        }
    } catch (err) {
        console.warn("⚠️ Table Supabase non accessible, passage en mode cache local", err);
    }

    // 2. Fallback LocalStorage propre
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
 * Vérifie si une inscription appartient à la session (valide tous les membres inscrits).
 */
function estInscriptionNouvelleSession(item) {
    if (!item) return false;
    return Boolean(item.nom || item.email || item.whatsapp);
}

/**
 * Compte uniquement les inscrits de la NOUVELLE formation (Excel & Prompt Engineering - Octobre 2026).
 */
async function obtenirNombreInscrits() {
    try {
        const list = await recupererInscriptions();
        if (!Array.isArray(list)) return 0;
        return list.filter(estInscriptionNouvelleSession).length;
    } catch (e) {
        return 0;
    }
}

/**
 * Enregistre un nouvel inscrit directement.
 */
async function ajouterInscription(entry) {
    const ticketCode = entry.ticket_code || genererCodeTicket();
    
    // 1. Structure complète pour LocalStorage et Formspree
    const fullRecord = {
        ticket_code: ticketCode,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut || 'Participant',
        genre: entry.genre || 'Non spécifié',
        age: entry.age || '',
        ordi: entry.ordi || 'Non précisé',
        attentes: entry.attentes || '',
        niveau: entry.formation || entry.niveau || 'Les deux formations',
        statut_validation: entry.statut_validation || "Liste d'attente",
        date: entry.date || new Date().toISOString()
    };

    // 2. Structure compatible avec le schéma SQL Supabase
    const niveauDetail = `${fullRecord.niveau} | Genre: ${fullRecord.genre} | Âge: ${fullRecord.age} | Ordi: ${fullRecord.ordi} | Attentes: ${fullRecord.attentes}`;
    const supabaseRecord = {
        ticket_code: ticketCode,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut || 'Participant',
        niveau: niveauDetail
    };

    // 3. Sauvegarde locale immédiate (Cache local de confort)
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const current = raw ? JSON.parse(raw) : [];
            current.unshift(fullRecord);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        }
    } catch (e) {
        console.error("Erreur LocalStorage", e);
    }

    // 4. Envoi instantané vers Formspree (FormData) et Supabase Cloud (Non-bloquant)
    try {
        const formData = new FormData();
        formData.append('nom', fullRecord.nom || '');
        formData.append('email', fullRecord.email || '');
        formData.append('whatsapp', fullRecord.whatsapp || '');
        formData.append('statut', fullRecord.statut || '');
        formData.append('genre', fullRecord.genre || '');
        formData.append('age', fullRecord.age || '');
        formData.append('ordi', fullRecord.ordi || '');
        formData.append('attentes', fullRecord.attentes || '');
        formData.append('formation', fullRecord.niveau || '');
        formData.append('ticket_code', fullRecord.ticket_code || '');
        formData.append('_subject', `Nouvelle Inscription AEEMCI : ${fullRecord.nom} (${fullRecord.ticket_code})`);
        formData.append('_captcha', 'false');
        formData.append('_template', 'table');

        fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData
        }).catch(err => console.error("Erreur Formspree:", err));
    } catch (e) {}

    try {
        fetch(SUPABASE_PRIMARY_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(supabaseRecord)
        }).catch(err => console.error("Erreur Supabase:", err));
    } catch (e) {}

    return { success: true, estDoublon: false };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recupererInscriptions, obtenirNombreInscrits, ajouterInscription, genererCodeTicket, MAX_CAPACITE };
}
