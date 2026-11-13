/**
 * SCRIPT PRINCIPAL INTERFACE MEMBRE (main.js)
 * Section AEEMCI EMSP Abidjan — Recensement & Cartes de Membre
 */

document.addEventListener('DOMContentLoaded', async () => {
  initApp();
});

let allMembresCache = [];

async function initApp() {
  await actualiserCompteurMembres();
  initFormListener();
}

/**
 * Met à jour le compteur en direct des membres recensés
 */
async function actualiserCompteurMembres() {
  try {
    allMembresCache = await recupererTousLesMembres();
    const countEl = document.getElementById('heroCount');
    if (countEl) {
      countEl.textContent = allMembresCache.length;
    }
  } catch (e) {
    console.warn("Erreur chargement compteur:", e);
  }
}

/**
 * Gestionnaire du formulaire de recensement
 */
function initFormListener() {
  const form = document.getElementById('recensementForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitLabel = document.getElementById('submitLabel');
    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Enregistrement en cours...';

    // Récupération des commissions cochées
    const commissionsChecked = Array.from(document.querySelectorAll('input[name="commissions"]:checked'))
      .map(cb => cb.value);

    const formData = {
      matricule: genererMatriculeMembre(),
      nom: document.getElementById('f-nom').value.trim(),
      genre: document.getElementById('f-genre').value,
      nationalite: document.getElementById('f-nationalite').value,
      date_naissance: document.getElementById('f-date-naissance').value || null,
      groupe_sanguin: document.getElementById('f-groupe-sanguin').value,
      whatsapp: formaterNumeroTelephone(document.getElementById('f-whatsapp').value),
      telephone_urgence: formaterNumeroTelephone(document.getElementById('f-urgence').value || ''),
      email: document.getElementById('f-email').value.trim(),
      statut: document.getElementById('f-statut').value,
      cycle: document.getElementById('f-cycle').value,
      filiere: document.getElementById('f-filiere').value,
      niveau: document.getElementById('f-niveau').value,
      residence: document.getElementById('f-residence').value,
      precision_residence: document.getElementById('f-precision-residence').value.trim(),
      commissions: commissionsChecked,
      competences: document.getElementById('f-competences').value.trim(),
      remarques: document.getElementById('f-remarques').value.trim(),
      statut_validation: "Validé"
    };

    try {
      const res = await enregistrerNouveauMembre(formData);
      afficherCarteMembre(res.data);
      form.reset();
      actualiserCompteurMembres();
    } catch (err) {
      alert("Une erreur est survenue lors de l'enregistrement. Vos données ont été sauvegardées localement.");
      afficherCarteMembre(formData);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Valider mon Recensement & Obtenir ma Carte";
    }
  });
}

/**
 * Affiche la carte de membre digitale avec QR Code
 */
function afficherCarteMembre(membre) {
  if (!membre) return;

  document.getElementById('c-matricule').textContent = membre.matricule;
  const alertMatricule = document.getElementById('c-matricule-alert');
  if (alertMatricule) alertMatricule.textContent = membre.matricule;

  document.getElementById('c-nom').textContent = membre.nom;
  document.getElementById('c-genre-badge').textContent = membre.genre;
  document.getElementById('c-filiere').textContent = `${membre.filiere} (${membre.niveau})`;
  document.getElementById('c-residence').textContent = `${membre.residence} — ${membre.precision_residence || ''}`;
  document.getElementById('c-nationalite').textContent = `Nationalité : ${membre.nationalite}`;

  // QR Code officiel
  const qrData = encodeURIComponent(`AEEMCI-EMSP|${membre.matricule}|${membre.nom}|${membre.filiere}|2026-2027`);
  const qrImg = document.getElementById('c-qrcode');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}&margin=1`;
  }

  // Bouton de partage WhatsApp
  const shareWaBtn = document.getElementById('shareWaBtn');
  if (shareWaBtn) {
    const waText = 
      `🌙 *CARTE DE MEMBRE OFFICIELLE — SECTION AEEMCI EMSP ABIDJAN*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Assalamou Aleykoum 👋,\n` +
      `Je suis officiellement recensé(e) au sein de la section AEEMCI EMSP Abidjan !\n\n` +
      `🪪 *Mon Matricule Officiel :* \`${membre.matricule}\`\n` +
      `👤 *Nom :* ${membre.nom}\n` +
      `🎓 *Filière :* ${membre.filiere} (${membre.niveau})\n` +
      `🏢 *Résidence :* ${membre.residence}\n` +
      `🌍 *Section :* AEEMCI EMSP Abidjan\n\n` +
      `🔗 *Lien du portail officiel :*\n` +
      `https://aeemci-koumassi.github.io/formation-word/recensement-emsp/`;

    const cleanPhone = String(membre.whatsapp || '').replace(/\D/g, '');
    shareWaBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
  }

  const modal = document.getElementById('carteModal');
  if (modal) modal.classList.remove('hidden');
}

window.closeCarteModal = function() {
  const modal = document.getElementById('carteModal');
  if (modal) modal.classList.add('hidden');
};

/* Modal Retrouver Ma Carte */
window.openRetrouverCarteModal = function() {
  const err = document.getElementById('searchCarteError');
  if (err) err.classList.add('hidden');
  const modal = document.getElementById('retrouverCarteModal');
  if (modal) modal.classList.remove('hidden');
};

window.closeRetrouverCarteModal = function() {
  const modal = document.getElementById('retrouverCarteModal');
  if (modal) modal.classList.add('hidden');
};

window.rechercherMaCarte = async function() {
  const input = document.getElementById('searchMembreQuery');
  const err = document.getElementById('searchCarteError');
  if (!input) return;

  const query = input.value.trim().toLowerCase();
  if (!query) {
    if (err) {
      err.textContent = "Veuillez entrer un numéro WhatsApp ou un matricule.";
      err.classList.remove('hidden');
    }
    return;
  }

  if (allMembresCache.length === 0) {
    allMembresCache = await recupererTousLesMembres();
  }

  const queryDigits = query.replace(/\D/g, '');

  const match = allMembresCache.find(m => {
    const matMatch = (m.matricule || '').toLowerCase().includes(query);
    const nomMatch = (m.nom || '').toLowerCase().includes(query);
    const phoneDigits = String(m.whatsapp || '').replace(/\D/g, '');
    const phoneMatch = queryDigits && phoneDigits && (phoneDigits.includes(queryDigits) || queryDigits.includes(phoneDigits));
    return matMatch || nomMatch || phoneMatch;
  });

  if (match) {
    closeRetrouverCarteModal();
    afficherCarteMembre(match);
  } else {
    if (err) {
      err.textContent = "Aucun membre trouvé correspondant à ces informations. Vérifiez le numéro ou remplissez le formulaire de recensement.";
      err.classList.remove('hidden');
    }
  }
};
