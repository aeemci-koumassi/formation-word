/**
 * MODULE BASE DE DONNÉES HYBRIDE (SUPABASE CLOUD + FORMSUBMIT)
 * Projet : Double Formation Excel & Prompt Engineering (AEEMCI Koumassi)
 * Session : Dimanche 04 Octobre 2026
 */

let FORMSPREE_ENDPOINT = "https://formsubmit.co/ajax/koumayaya7@gmail.com";
const SUPABASE_PRIMARY_URL = "https://iktoigkruredsudprndu.supabase.co/rest/v1/inscriptions_word";
const SUPABASE_KEY = "sb_publishable_NY-DqlKRgy_IxSoYluUgLQ_eLcoUQbv";

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
 * Récupère l'intégralité des inscrits depuis Supabase Cloud via le SDK Officiel (ou Fetch Direct).
 */
async function recupererInscriptions() {
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('inscriptions_word')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5000);
            
            if (!error && Array.isArray(data)) {
                return data.map(parseSupabaseItem);
            }
        }
    } catch (e) {
        console.warn("Erreur Supabase SDK Select:", e);
    }

    try {
        const response = await fetch(`${SUPABASE_PRIMARY_URL}?select=*&limit=5000&order=created_at.desc&_t=${Date.now()}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                return data.map(parseSupabaseItem);
            }
        }
    } catch (err) {
        console.warn("Erreur Fetch Direct Select:", err);
    }

    return [];
}

function estInscriptionNouvelleSession(item) {
    return Boolean(item);
}

async function obtenirNombreInscrits() {
    try {
        const list = await recupererInscriptions();
        return list.length;
    } catch (e) {
        return 0;
    }
}

/**
 * Enregistre un nouvel inscrit directement dans le Cloud Supabase centralisé.
 * Utilise en priorité le SDK officiel Supabase compatible avec les réseaux mobiles 3G/4G/WiFi.
 */
async function ajouterInscription(entry) {
    const ticketCode = entry.ticket_code || genererCodeTicket();
    
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

    const niveauDetail = `${fullRecord.niveau} | Genre: ${fullRecord.genre} | Âge: ${fullRecord.age} | Ordi: ${fullRecord.ordi} | Attentes: ${fullRecord.attentes}`;
    const supabaseRecord = {
        ticket_code: ticketCode,
        nom: entry.nom,
        email: entry.email,
        whatsapp: entry.whatsapp,
        statut: entry.statut || 'Participant',
        niveau: niveauDetail
    };

    // 1. Insertion via le SDK Supabase Officiel (Ultra-robuste sur réseaux mobiles)
    let isSavedInCloud = false;
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('inscriptions_word')
                .insert([supabaseRecord]);
            
            if (!error) {
                isSavedInCloud = true;
            } else {
                console.error("Supabase SDK Insert Error:", error);
            }
        }
    } catch (e) {
        console.error("Exception SDK Supabase:", e);
    }

    // Fallback Fetch REST direct
    if (!isSavedInCloud) {
        try {
            await fetch(SUPABASE_PRIMARY_URL, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(supabaseRecord)
            });
        } catch (e) {
            console.error("Erreur Fetch Direct Supabase:", e);
        }
    }

    // 2. Notification Email FormSubmit (Arrière-plan non-bloquant)
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
        }).catch(err => console.error("Erreur Notification:", err));
    } catch (e) {}

    return { success: true, estDoublon: false };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recupererInscriptions, obtenirNombreInscrits, ajouterInscription, genererCodeTicket, MAX_CAPACITE };
}
