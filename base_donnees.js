/**
 * MODULE BASE DE DONNÉES HYBRIDE (SUPABASE CLOUD + FORMSPREE)
 * Projet : Double Formation Excel & Prompt Engineering (AEEMCI Koumassi)
 * Session : Dimanche 04 Octobre 2026
 */

let FORMSPREE_ENDPOINT = "https://formspree.io/f/xljezjko";
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
 * Récupère uniquement la liste des inscrits de la NOUVELLE formation (04 Octobre 2026).
 */
async function recupererInscriptions() {
    // 1. Essai sur la table Supabase active (inscriptions_word) avec contournement strict du cache navigateur
    try {
        const response = await fetch(`${SUPABASE_PRIMARY_URL}?select=*&created_at=gte.2026-09-28T00:00:00Z&order=created_at.desc&_t=${Date.now()}`, {
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
    
    // Normalisation pour vérification anti-doublon (doublon si email ET téléphone correspondent tous deux)
    const cleanEmail = (entry.email || '').trim().toLowerCase();
    const cleanPhone = (entry.whatsapp || '').replace(/\D/g, '');

    const existant = list.find(item => {
        const itemEmail = (item.email || '').trim().toLowerCase();
        const itemPhone = (item.whatsapp || '').replace(/\D/g, '');
        const emailMatch = cleanEmail && itemEmail === cleanEmail;
        const phoneMatch = cleanPhone && cleanPhone.length >= 8 && itemPhone === cleanPhone;
        return emailMatch && phoneMatch;
    });

    // Même si un dossier similaire existe, enregistrer toujours la nouvelle soumission dans Supabase
    if (existant) {
        console.log("ℹ️ Inscription existante trouvée, enregistrement de la nouvelle soumission :", existant);
    }

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

    // 2. Structure compatible avec le schéma SQL Supabase (sans colonnes manquantes)
    const niveauDetail = `${fullRecord.niveau} | Genre: ${fullRecord.genre} | Âge: ${fullRecord.age} | Ordi: ${fullRecord.ordi} | Attentes: ${fullRecord.attentes}`;
    const supabaseRecord = {
        ticket_code: ticketCode,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut || 'Participant',
        niveau: niveauDetail
    };

    // 3. Sauvegarde locale immédiate (Cache)
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

    // 4. Envoi Formspree en arrière-plan (non-bloquant pour l'utilisateur)
    try {
        fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ ...fullRecord, type_inscription: "Double Formation Excel & Prompt Engineering (04 Octobre)" })
        }).catch(err => console.error("Erreur Formspree:", err));
    } catch (e) {}

    // 5. Envoi vers Supabase Cloud ultra-rapide (Maximum 2 secondes d'attente)
    try {
        const supabaseFetch = fetch(SUPABASE_PRIMARY_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(supabaseRecord)
        }).catch(err => console.error("Erreur Supabase:", err));

        const timeout = new Promise(resolve => setTimeout(resolve, 2000));
        await Promise.race([supabaseFetch, timeout]);
    } catch (e) {}

    return { success: true, estDoublon: false, totalCount: totalCurrent + 1 };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recupererInscriptions, obtenirNombreInscrits, ajouterInscription, genererCodeTicket, MAX_CAPACITE };
}
