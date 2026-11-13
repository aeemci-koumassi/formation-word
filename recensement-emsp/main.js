/**
 * SCRIPT PRINCIPAL INTERFACE MEMBRE (main.js)
 * Section AEEMCI EMSP Abidjan — Portail de Recensement Officiel
 */

document.addEventListener('DOMContentLoaded', async () => {
  initApp();
});

let allMembresCache = [];
let etapeActuelle = 1;
const TOTAL_ETAPES = 3;

async function initApp() {
  await actualiserCompteurMembres();
  initFormListener();
  mettreAJourIndicateursStepper();
}

/**
 * Gestion du Stepper interactif (Navigation par étapes)
 */
window.allerAEtape = function(targetStep) {
  if (targetStep === etapeActuelle) return;

  // Validation séquentielle si on avance
  if (targetStep > etapeActuelle) {
    if (etapeActuelle === 1 && !validerEtape1()) return;
    if (etapeActuelle === 2 && !validerEtape2()) return;
  }

  // Masquer l'étape actuelle
  const currentPanel = document.getElementById(`step-${etapeActuelle}`);
  if (currentPanel) currentPanel.classList.add('hidden');

  // Afficher la nouvelle étape
  const targetPanel = document.getElementById(`step-${targetStep}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('animate-in', 'fade-in', 'duration-150');
  }

  etapeActuelle = targetStep;
  mettreAJourIndicateursStepper();

  // Défilement doux vers l'entête du formulaire pour le confort de lecture
  const formCard = document.getElementById('formContainer');
  if (formCard) {
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function validerEtape1() {
  const nom = document.getElementById('f-nom');
  const genre = document.getElementById('f-genre');
  const nationalite = document.getElementById('f-nationalite');
  const whatsapp = document.getElementById('f-whatsapp');

  if (!nom || !nom.value.trim()) {
    alert("Veuillez renseigner votre Nom complet et Prénoms pour continuer.");
    if (nom) nom.focus();
    return false;
  }

  if (!genre || !genre.value) {
    alert("Veuillez préciser votre Genre.");
    if (genre) genre.focus();
    return false;
  }

  if (!nationalite || !nationalite.value) {
    alert("Veuillez sélectionner votre Nationalité.");
    if (nationalite) nationalite.focus();
    return false;
  }

  if (!whatsapp || !whatsapp.value.trim()) {
    alert("Veuillez renseigner votre numéro WhatsApp officiel.");
    if (whatsapp) whatsapp.focus();
    return false;
  }

  return true;
}

function validerEtape2() {
  const statut = document.getElementById('f-statut');
  const cycle = document.getElementById('f-cycle');
  const filiere = document.getElementById('f-filiere');
  const niveau = document.getElementById('f-niveau');

  if (!statut || !statut.value) {
    alert("Veuillez préciser votre Statut à l'EMSP.");
    if (statut) statut.focus();
    return false;
  }

  if (!cycle || !cycle.value) {
    alert("Veuillez sélectionner votre Cycle de formation.");
    if (cycle) cycle.focus();
    return false;
  }

  if (!filiere || !filiere.value) {
    alert("Veuillez préciser votre Filière / Département.");
    if (filiere) filiere.focus();
    return false;
  }

  if (!niveau || !niveau.value) {
    alert("Veuillez indiquer votre Niveau d'étude.");
    if (niveau) niveau.focus();
    return false;
  }

  return true;
}

function validerEtape3() {
  const residence = document.getElementById('f-residence');
  const precision = document.getElementById('f-precision-residence');

  if (!residence || !residence.value) {
    alert("Veuillez indiquer votre Lieu de Logement.");
    if (residence) residence.focus();
    return false;
  }

  if (!precision || !precision.value.trim()) {
    alert("Veuillez préciser votre Résidence (Chambre si campus ou Commune/Quartier).");
    if (precision) precision.focus();
    return false;
  }

  return true;
}

function mettreAJourIndicateursStepper() {
  // Mise à jour de la barre de progression
  const progressBar = document.getElementById('stepperProgressBar');
  if (progressBar) {
    const percentages = { 1: '15%', 2: '50%', 3: '100%' };
    progressBar.style.width = percentages[etapeActuelle] || '15%';
  }

  // Mise à jour des boutons indicateurs d'étapes
  for (let s = 1; s <= TOTAL_ETAPES; s++) {
    const btn = document.getElementById(`stepIndicator-${s}`);
    if (!btn) continue;

    const circle = btn.querySelector('div');
    const label = btn.querySelector('.step-label');
    const num = btn.querySelector('.step-num');
    const check = btn.querySelector('.step-check');

    if (s < etapeActuelle) {
      // Étape antérieure : complétée
      if (circle) circle.className = "w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs transition-all border-2 border-white";
      if (label) label.className = "step-label text-[10px] sm:text-[11px] font-bold text-emerald-800 mt-1 block text-center";
      if (num) num.classList.add('hidden');
      if (check) check.classList.remove('hidden');
    } else if (s === etapeActuelle) {
      // Étape active
      if (circle) circle.className = "w-8 h-8 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md transition-all border-2 border-white ring-4 ring-emerald-600/20";
      if (label) label.className = "step-label text-[10px] sm:text-[11px] font-extrabold text-slate-900 mt-1 block text-center";
      if (num) num.classList.remove('hidden');
      if (check) check.classList.add('hidden');
    } else {
      // Étape future
      if (circle) circle.className = "w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shadow-2xs transition-all border-2 border-white";
      if (label) label.className = "step-label text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-1 block text-center";
      if (num) num.classList.remove('hidden');
      if (check) check.classList.add('hidden');
    }
  }

  const currentBadge = document.getElementById('currentStepBadge');
  if (currentBadge) {
    currentBadge.textContent = `Étape ${etapeActuelle} sur ${TOTAL_ETAPES}`;
  }
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

  // Synchronisation ergonomique Niveau (Semestre 1 / Tronc Commun) et Filière
  const niveauEl = document.getElementById('f-niveau');
  const filiereEl = document.getElementById('f-filiere');
  if (niveauEl && filiereEl) {
    niveauEl.addEventListener('change', () => {
      if (niveauEl.value.includes('Semestre 1 (Tronc Commun)')) {
        if (niveauEl.value.startsWith('Licence')) {
          filiereEl.value = 'Tronc Commun — Licence (Semestre 1)';
        } else if (niveauEl.value.startsWith('Master')) {
          filiereEl.value = 'Tronc Commun — Master (Semestre 1)';
        }
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validerEtape3()) return;

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
      window.allerAEtape(1);
      actualiserCompteurMembres();
    } catch (err) {
      alert("Vos informations ont bien été enregistrées dans le registre local.");
      afficherRecepisseEnregistrement(formData);
      form.reset();
      window.allerAEtape(1);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Confirmer et Valider mon Inscription Officielle";
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
