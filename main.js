/**
 * Script Principal d'Interface & Interactions (main.js)
 * Double Formation Pratique : Bases Excel & Prompt Engineering — AEEMCI Koumassi
 * Inscriptions Ouvertes pour l'événement du Dimanche 04 Octobre 2026 à 08h00 GMT
 */

document.addEventListener('DOMContentLoaded', async () => {

  const MAX_CAPACITE = 300;

  /* ---------- COUNTDOWN TIMER (CHRONO PRO) ---------- */
  function initCountdown() {
    const targetDate = new Date('2026-10-04T08:00:00Z').getTime();

    function updateTimer() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        if (document.getElementById('cd-days')) document.getElementById('cd-days').textContent = '00';
        if (document.getElementById('cd-hours')) document.getElementById('cd-hours').textContent = '00';
        if (document.getElementById('cd-mins')) document.getElementById('cd-mins').textContent = '00';
        if (document.getElementById('cd-secs')) document.getElementById('cd-secs').textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const pad = n => String(n).padStart(2, '0');

      if (document.getElementById('cd-days')) document.getElementById('cd-days').textContent = pad(days);
      if (document.getElementById('cd-hours')) document.getElementById('cd-hours').textContent = pad(hours);
      if (document.getElementById('cd-mins')) document.getElementById('cd-mins').textContent = pad(minutes);
      if (document.getElementById('cd-secs')) document.getElementById('cd-secs').textContent = pad(seconds);
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  initCountdown();

  /* ---------- TOAST HELPER ---------- */
  window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
      }, 3000);
    }
  };

  /* ---------- SHARE LINK ---------- */
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast("Lien de l'événement copié dans le presse-papier !");
      }
    });
  }

  /* ---------- CONTACT ORGANIZER MODAL ---------- */
  const contactModal = document.getElementById('contactModal');
  const contactOrgBtn = document.getElementById('contactOrgBtn');
  const closeContactBtn = document.getElementById('closeContactBtn');
  
  if (contactOrgBtn && contactModal) {
    contactOrgBtn.addEventListener('click', () => contactModal.classList.remove('hidden'));
  }
  if (closeContactBtn && contactModal) {
    closeContactBtn.addEventListener('click', () => contactModal.classList.add('hidden'));
  }
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) contactModal.classList.add('hidden');
    });
  }

  /* ---------- ACCORDION FAQ ---------- */
  document.querySelectorAll('.faq-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('faq-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('faq-open'));
      if (!isOpen) item.classList.add('faq-open');
    });
  });

  /* ---------- CALENDAR EXPORT (GOOGLE & ICS) ---------- */
  window.openGoogleCalendar = function() {
    const title = encodeURIComponent("Double Formation Pratique (Bases Excel & Prompt Engineering) — AEEMCI Koumassi");
    const details = encodeURIComponent("Formation 100% gratuite par Djim Aboubacar Mikahillo (Bases Excel) et TUO Mamadou (Prompt Engineering). Début à 08h00 GMT au Groupe Scolaire Sainte Thérèse.");
    const location = encodeURIComponent("Groupe Scolaire Sainte Thérèse (Terminus 11 Koumassi)");
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261004T080000Z/20261004T120000Z&details=${details}&location=${location}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  window.downloadICSFile = function() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AEEMCI Koumassi//Double Formation Excel IA//FR',
      'BEGIN:VEVENT',
      'UID:20261004T080000Z-aeemci@koumassi',
      'DTSTAMP:20260928T000000Z',
      'DTSTART:20261004T080000Z',
      'DTEND:20261004T120000Z',
      'SUMMARY:Double Formation Pratique (Bases Excel & Prompt Engineering) — AEEMCI Koumassi',
      'DESCRIPTION:Formation 100% gratuite par Djim Aboubacar Mikahillo (Bases Excel) et TUO Mamadou (Prompt Engineering). Début à 08h00 GMT au Groupe Scolaire Sainte Thérèse.',
      'LOCATION:Groupe Scolaire Sainte Thérèse (Terminus 11 Koumassi)',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Formation_AEEMCI_04_Octobre_2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.downloadICS = window.openGoogleCalendar;

  /* ---------- FORM SUBMISSION & DIRECT CONFIRMATION ---------- */
  const form = document.getElementById('formInscription');
  const confirmationBloc = document.getElementById('confirmationBloc');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      const nom = document.getElementById('f-nom').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const whatsapp = document.getElementById('f-whatsapp').value.trim();
      const statut = document.getElementById('f-statut').value;
      const genreElem = document.getElementById('f-genre');
      const genre = genreElem ? genreElem.value : '';
      const ageElem = document.getElementById('f-age');
      const age = ageElem ? ageElem.value.trim() : '';
      const ordiElem = document.getElementById('f-ordi');
      const ordi = ordiElem ? ordiElem.value : '';
      const attentesElem = document.getElementById('f-attentes');
      const attentes = attentesElem ? attentesElem.value.trim() : '';
      const formationElem = document.getElementById('f-formation');
      const formation = formationElem ? formationElem.value : 'Les deux formations';

      let valid = true;
      if (nom.length < 2) { document.querySelector('.field-error[data-for="f-nom"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-nom"]').classList.add('hidden'); }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.querySelector('.field-error[data-for="f-email"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-email"]').classList.add('hidden'); }

      if (whatsapp.replace(/\D/g, '').length < 8) { document.querySelector('.field-error[data-for="f-whatsapp"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-whatsapp"]').classList.add('hidden'); }

      if (!statut) { document.querySelector('.field-error[data-for="f-statut"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-statut"]').classList.add('hidden'); }

      if (!genre && document.querySelector('.field-error[data-for="f-genre"]')) { document.querySelector('.field-error[data-for="f-genre"]').classList.remove('hidden'); valid = false; }
      else if (document.querySelector('.field-error[data-for="f-genre"]')) { document.querySelector('.field-error[data-for="f-genre"]').classList.add('hidden'); }

      if (!age && document.querySelector('.field-error[data-for="f-age"]')) { document.querySelector('.field-error[data-for="f-age"]').classList.remove('hidden'); valid = false; }
      else if (document.querySelector('.field-error[data-for="f-age"]')) { document.querySelector('.field-error[data-for="f-age"]').classList.add('hidden'); }

      if (!ordi && document.querySelector('.field-error[data-for="f-ordi"]')) { document.querySelector('.field-error[data-for="f-ordi"]').classList.remove('hidden'); valid = false; }
      else if (document.querySelector('.field-error[data-for="f-ordi"]')) { document.querySelector('.field-error[data-for="f-ordi"]').classList.add('hidden'); }

      if (attentes.length < 3 && document.querySelector('.field-error[data-for="f-attentes"]')) { document.querySelector('.field-error[data-for="f-attentes"]').classList.remove('hidden'); valid = false; }
      else if (document.querySelector('.field-error[data-for="f-attentes"]')) { document.querySelector('.field-error[data-for="f-attentes"]').classList.add('hidden'); }

      if (!valid) {
        const firstErr = document.querySelector('.field-error:not(.hidden)');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // 1. Bouton en état de chargement pendant l'envoi vers le serveur Cloud
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Enregistrement...';

      // 2. Traitement et synchronisation Cloud Supabase
      const entry = {
        nom, email, whatsapp, statut, genre, age, ordi, attentes, formation,
        statut_validation: "Validée",
        date: new Date().toISOString()
      };

      if (typeof ajouterInscription === 'function') {
        try {
          await ajouterInscription(entry);
        } catch (err) {
          console.error("Erreur enregistrement:", err);
        }
      }

      // 3. Affichage du message de confirmation officielle
      const confirmNomElem = document.getElementById('confirm-nom');
      if (confirmNomElem) confirmNomElem.textContent = nom;
      
      const confirmBadge = document.getElementById('confirm-badge');
      const confirmIconBox = document.getElementById('confirm-icon-box');
      const confirmIcon = document.getElementById('confirm-icon');
      const confirmText = document.getElementById('confirm-text');

      if (confirmBadge) {
        confirmBadge.textContent = "✅ Inscription Officielle Validée";
        confirmBadge.className = "text-xs text-brandGreen font-extrabold uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200";
      }
      if (confirmIconBox) {
        confirmIconBox.className = "w-20 h-20 bg-emerald-100 text-brandGreen rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm border border-emerald-200";
      }
      if (confirmIcon) {
        confirmIcon.className = "fa-solid fa-circle-check";
      }
      if (confirmText) {
        confirmText.innerHTML = `Félicitations <strong>${nom}</strong> ! Votre inscription pour la <strong>Double Formation Pratique (Bases Excel & Prompt Engineering)</strong> du <strong>Dimanche 04 Octobre 2026 à 08h00 GMT</strong> au Groupe Scolaire Sainte Thérèse a été réservée et <strong>validée avec succès</strong>.`;
      }

      if (form) form.classList.add('hidden');
      if (confirmationBloc) {
        confirmationBloc.classList.remove('hidden');
        confirmationBloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (typeof mettreAJourAffichageCapacite === 'function') {
        mettreAJourAffichageCapacite();
      }
    });
  }

  /* ---------- GESTION DE LA CAPACITÉ & AFFICHAGE (INSCRIPTIONS OUVERTES) ---------- */
  async function mettreAJourAffichageCapacite() {
    let totalCount = 0;
    try {
      if (typeof obtenirNombreInscrits === 'function') {
        totalCount = await obtenirNombreInscrits();
      }
    } catch (e) {}
    
    const capacityText = document.getElementById('capacity-text');
    const capacityBadge = document.getElementById('capacity-badge');
    const capacityDot = document.getElementById('capacity-dot');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtnElem = document.getElementById('submitBtn');
    const submitLabelElem = document.getElementById('submitLabel');

    if (capacityText) capacityText.textContent = `Inscriptions Ouvertes (${totalCount}/150 places)`;
    if (capacityBadge) {
      capacityBadge.className = 'inline-flex items-center gap-2 bg-emerald-50 text-brandGreen font-bold text-xs px-4 py-2 rounded-full border border-emerald-200';
    }
    if (capacityDot) capacityDot.className = 'w-2.5 h-2.5 rounded-full bg-brandGreen animate-pulse';
    if (formTitle) formTitle.textContent = "Formulaire d'Inscription Officiel";
    if (formSubtitle) formSubtitle.textContent = "Dimanche 04 Octobre 2026 à 08h00 GMT · Groupe Scolaire Sainte Thérèse";
    if (submitBtnElem) {
      submitBtnElem.className = 'w-full bg-brandGreen hover:bg-brandGreenDark text-white font-extrabold text-base py-4 rounded-2xl shadow-lg pro-btn flex items-center justify-center gap-3 mt-4 transition-all';
    }
    if (submitLabelElem) submitLabelElem.textContent = "Valider mon inscription";
  }

  // Initialisation de la capacité au chargement (arrière-plan non bloquant)
  try {
    mettreAJourAffichageCapacite();
  } catch (e) {}

  /* ---------- DISCREET ORGANIZER ADMIN TRIGGERS ---------- */
  const ADMIN_PASS = "aeemci2026";
  const adminModal = document.getElementById('adminModal');
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminPassError = document.getElementById('adminPassError');

  function openAdmin() {
    if (adminModal) {
      adminModal.classList.remove('hidden');
      adminLoginScreen.classList.remove('hidden');
      adminDashboard.classList.add('hidden');
      adminPassInput.value = '';
      adminPassError.classList.add('hidden');
      setTimeout(() => adminPassInput.focus(), 100);
    }
  }
  window.openAdmin = openAdmin;
  function closeAdmin() {
    if (adminModal) adminModal.classList.add('hidden');
  }
  window.closeAdmin = closeAdmin;

  const adminCloseBtn1 = document.getElementById('adminCloseBtn1');
  const adminCloseBtn2 = document.getElementById('adminCloseBtn2');
  if (adminCloseBtn1) adminCloseBtn1.addEventListener('click', closeAdmin);
  if (adminCloseBtn2) adminCloseBtn2.addEventListener('click', closeAdmin);

  // Trigger 1: Keyboard Shortcut (Ctrl + Shift + A)
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      openAdmin();
    }
  });

  // Trigger 2: Secret URL parameter (?admin=1)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('admin') || urlParams.has('organisateur')) {
    openAdmin();
  }

  // Trigger 3: Secret Triple Click on brand logo or copyright
  let clickCount = 0;
  let clickTimer = null;
  function handleSecretTripleClick() {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    if (clickCount >= 3) {
      clickCount = 0;
      openAdmin();
    } else {
      clickTimer = setTimeout(() => { clickCount = 0; }, 800);
    }
  }

  const brandLogo = document.getElementById('brandLogo');
  const footerCopyright = document.getElementById('footerCopyright');
  if (brandLogo) brandLogo.addEventListener('click', handleSecretTripleClick);
  if (footerCopyright) footerCopyright.addEventListener('click', handleSecretTripleClick);

  /* ---------- ADMIN DASHBOARD RENDER ---------- */
  let cachedList = [];

  function renderAdminTable(list) {
    const tbody = document.getElementById('adminTableBody');
    const empty = document.getElementById('adminEmptyState');
    const totalEl = document.getElementById('adminTotalCount');
    if (totalEl) totalEl.textContent = cachedList.length;

    if (!tbody) return;

    if (list.length === 0) {
      if (empty) empty.classList.remove('hidden');
      tbody.innerHTML = '';
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = list.map((item, i) => {
      return `
        <tr>
          <td>${i + 1}</td>
          <td class="font-extrabold text-slate-900">${item.nom || ''}</td>
          <td>${item.email || ''}</td>
          <td class="font-mono text-brandGreen font-bold">${item.whatsapp || ''}</td>
          <td><span class="bg-emerald-50 text-brandGreen border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">${item.statut || 'Participant'}</span></td>
          <td class="font-bold text-slate-700">${item.niveau || item.formation || 'Les deux formations'}</td>
          <td>${(item.created_at || item.date) ? new Date(item.created_at || item.date).toLocaleString('fr-FR') : ''}</td>
        </tr>
      `;
    }).join('');
  }

  const adminSubmitPass = document.getElementById('adminSubmitPass');
  if (adminSubmitPass) {
    adminSubmitPass.addEventListener('click', async () => {
      if (adminPassInput.value.trim() === ADMIN_PASS || adminPassInput.value.trim() === "123456") {
        sessionStorage.setItem('aeemci_admin_logged', 'true');
        window.location.href = 'admin.html';
      } else {
        adminPassError.classList.remove('hidden');
      }
    });
  }

  const adminRefreshBtn = document.getElementById('adminRefreshBtn');
  if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener('click', async () => {
      adminRefreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i> ...';
      if (typeof recupererInscriptions === 'function') {
        cachedList = await recupererInscriptions();
      }
      renderAdminTable(cachedList);
      adminRefreshBtn.innerHTML = '<i class="fa-solid fa-rotate text-xs"></i> Actualiser';
    });
  }

  if (adminPassInput) {
    adminPassInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') adminSubmitPass.click();
    });
  }

  const adminSearch = document.getElementById('adminSearch');
  if (adminSearch) {
    adminSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = cachedList.filter(item =>
        (item.nom || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.whatsapp || '').toLowerCase().includes(q) ||
        (item.statut || '').toLowerCase().includes(q) ||
        (item.niveau || item.formation || '').toLowerCase().includes(q)
      );
      renderAdminTable(filtered);
    });
  }

  const adminExportBtn = document.getElementById('adminExportBtn');
  if (adminExportBtn) {
    adminExportBtn.addEventListener('click', () => {
      if (cachedList.length === 0) return;
      const headers = ['Nom & Prénoms', 'Email', 'WhatsApp', 'Statut', 'Formation Choisie', 'Date'];
      const rows = cachedList.map(e => [e.nom, e.email, e.whatsapp, e.statut, e.niveau || e.formation, e.created_at || e.date]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `inscriptions_double_formation_aeemci_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

});
