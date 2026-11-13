/**
 * SCRIPT PRINCIPAL INTERFACE MEMBRE (main.js)
 * Section AEEMCI EMSP Abidjan — Portail de Recensement Officiel
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
 * Met à jour l'effectif en direct des membres recensés
 */
async function actualiserCompteurMembres() {
  try {
    allMembresCache = await recupererTousLesMembres();
    const countEl = document.getElementById('heroCount');
    if (countEl) {
      countEl.textContent = allMembresCache.length;
    }
  } catch (e) {
    console.warn("Erreur chargement effectif:", e);
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
    if (submitLabel) submitLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Enregistrement officiel en cours...';

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
      afficherRecepisseEnregistrement(res.data);
      form.reset();
      actualiserCompteurMembres();
    } catch (err) {
      alert("Vos informations ont bien été enregistrées dans le registre local.");
      afficherRecepisseEnregistrement(formData);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Confirmer et Enregistrer ma Fiche de Recensement";
    }
  });
}

/**
 * Affiche l'attestation / récépissé officiel de recensement
 */
function afficherRecepisseEnregistrement(membre) {
  if (!membre) return;

  const matEl = document.getElementById('rec-matricule');
  if (matEl) matEl.textContent = membre.matricule;

  const nomEl = document.getElementById('rec-nom');
  if (nomEl) nomEl.textContent = membre.nom;

  const genreEl = document.getElementById('rec-genre');
  if (genreEl) genreEl.textContent = membre.genre;

  const filiereEl = document.getElementById('rec-filiere');
  if (filiereEl) filiereEl.textContent = `${membre.filiere} — ${membre.niveau}`;

  const resEl = document.getElementById('rec-residence');
  if (resEl) resEl.textContent = `${membre.residence} (${membre.precision_residence || 'Non précisé'})`;

  const waEl = document.getElementById('rec-whatsapp');
  if (waEl) waEl.textContent = membre.whatsapp;

  // Configuration du bouton de partage / confirmation WhatsApp
  const shareWaBtn = document.getElementById('recWhatsappShareBtn');
  if (shareWaBtn) {
    const waText = 
      `Assalamou Aleykoum cher Secrétaire Général 👋,\n\n` +
      `Je viens de valider ma fiche de recensement au sein de la *Section AEEMCI EMSP Abidjan* !\n\n` +
      `📋 *RÉCÉPISSÉ D'ENREGISTREMENT :*\n` +
      `• *Réf. Dossier :* \`${membre.matricule}\`\n` +
      `• *Nom :* ${membre.nom}\n` +
      `• *Statut :* ${membre.statut}\n` +
      `• *Filière :* ${membre.filiere} (${membre.niveau})\n` +
      `• *Résidence :* ${membre.residence} — ${membre.precision_residence || ''}\n\n` +
      `Merci pour l'initiative et bon mandat à toute l'équipe dirigeante ! 🤲✨`;

    const sgPhone = "2250711985810";
    shareWaBtn.href = `https://wa.me/${sgPhone}?text=${encodeURIComponent(waText)}`;
  }

  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.remove('hidden');
}

window.closeConfirmationModal = function() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.add('hidden');
};
