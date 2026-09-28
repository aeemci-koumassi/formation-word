/**
 * MODULE BASE DE DONNÉES HYBRIDE (SUPABASE CLOUD + FORMSPREE)
 * Projet : Double Formation Excel & Prompt Engineering (AEEMCI Koumassi)
 * Statut : Inscriptions Ouvertes pour la nouvelle formation du 04 Octobre
 */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xljezjko";
const SUPABASE_REST_URL = "https://iktoigkruredsudprndu.supabase.co/rest/v1/inscriptions_word";
const SUPABASE_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";
const LOCAL_STORAGE_KEY = 'aeemci_inscriptions_excel_ia_list';

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
 * Compte uniquement les inscrits de la NOUVELLE formation (Excel & Prompt Engineering - Octobre 2026).
 */
async function obtenirNombreInscrits() {
    try {
        const list = await recupererInscriptions();
        if (!Array.isArray(list)) return 0;
        
        // Filtre les inscriptions liées à la nouvelle formation
        const countNew = list.filter(item => {
            const f = (item.niveau || item.formation || '').toLowerCase();
            const dateStr = item.created_at || item.date;
            const isNewDate = dateStr && new Date(dateStr) >= new Date('2026-09-28T00:00:00Z');
            return f.includes('excel') || f.includes('prompt') || f.includes('deux') || isNewDate;
        }).length;

        return countNew;
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
        niveau: entry.formation || entry.niveau || 'Les deux formations'
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
    const promises = [
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
