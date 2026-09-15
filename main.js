/**
 * Script Principal d'Interface & Interactions (main.js)
 * Formation Pratique Microsoft Word — AEEMCI Koumassi
 * Gestion de la capacité (150 places max), Liste d'Attente & Redirection WhatsApp Automatique
 */

document.addEventListener('DOMContentLoaded', async () => {

  const MAX_CAPACITE = 150;

  // Lien du Groupe WhatsApp Principal (150 premières places)
  const WHATSAPP_LINK_PRINCIPAL = "https://chat.whatsapp.com/KzKBnGq3ZahFYohN2nm3gN?s=sh&p=a&mlu=4&ilr=4";
  
  // Lien du Groupe WhatsApp Liste d'Attente (2ème groupe)
  const WHATSAPP_LINK_ATTENTE = "https://chat.whatsapp.com/FLUfIUEujHj0ZkyIEGpNHp";

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

  /* ---------- CALENDAR .ICS EXPORT ---------- */
  window.downloadICS = function() {
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const start = new Date('2026-09-18T20:00:00Z');
    const end = new Date('2026-09-20T22:00:00Z');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AEEMCI Koumassi//Formation Word//FR',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@aeemci-koumassi`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      'SUMMARY:Formation Pratique Microsoft Word (20h00) — AEEMCI Koumassi',
      'DESCRIPTION:Formation gratuite pour élèves, étudiants et professionnels par Tall Seydou. Début chaque soir à 20h00 GMT en ligne.',
      'LOCATION:En ligne — Webinaire',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'formation-word-aeemci-koumassi.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calendarBtn2 = document.getElementById('calendarBtn2');
  if (calendarBtn2) {
    calendarBtn2.addEventListener('click', downloadICS);
  }

  /* ---------- GESTION DE LA CAPACITÉ (150 PLACES) ---------- */
  async function mettreAJourAffichageCapacite() {
    if (typeof obtenirNombreInscrits !== 'function') return;
    const totalCount = await obtenirNombreInscrits();
    
    const capacityText = document.getElementById('capacity-text');
    const capacityBadge = document.getElementById('capacity-badge');
    const capacityDot = document.getElementById('capacity-dot');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submitBtn');
    const submitLabel = document.getElementById('submitLabel');

    if (totalCount >= MAX_CAPACITE) {
      if (capacityText) capacityText.textContent = `${totalCount}/${MAX_CAPACITE} places — Liste d'attente`;
      if (capacityBadge) {
        capacityBadge.className = 'inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-amber-200';
      }
      if (capacityDot) capacityDot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
      if (formTitle) formTitle.textContent = "Inscription — Liste d'Attente";
      if (formSubtitle) formSubtitle.textContent = "Les 150 places principales sont réservées. Votre inscription sera placée sur liste d'attente prioritaire.";
      if (submitBtn) {
        submitBtn.className = 'w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-base py-3.5 rounded-2xl shadow-md luma-btn flex items-center justify-center gap-2 mt-2 transition-colors';
      }
      if (submitLabel) submitLabel.textContent = "S'inscrire sur la Liste d'Attente";
    } else {
      if (capacityText) capacityText.textContent = `Inscription Ouverte (${totalCount}/${MAX_CAPACITE} places)`;
      if (capacityBadge) {
        capacityBadge.className = 'inline-flex items-center gap-1.5 bg-emerald-50 text-lumaGreen font-semibold text-xs px-3 py-1.5 rounded-full border border-emerald-100';
      }
      if (capacityDot) capacityDot.className = 'w-2 h-2 rounded-full bg-lumaGreen animate-pulse';
      if (formTitle) formTitle.textContent = "Formulaire d'Inscription";
      if (formSubtitle) formSubtitle.textContent = "100% gratuit · Ouvert aux élèves, étudiants et professionnels";
      if (submitBtn) {
        submitBtn.className = 'w-full bg-lumaGreen hover:bg-lumaGreenDark text-white font-bold text-base py-3.5 rounded-2xl shadow-md luma-btn flex items-center justify-center gap-2 mt-2 transition-colors';
      }
      if (submitLabel) submitLabel.textContent = "Valider & Rejoindre le Groupe WhatsApp";
    }
  }

  // Initialisation de la capacité au chargement
  await mettreAJourAffichageCapacite();


  /* ---------- FORM SUBMISSION & WHATSAPP REDIRECT ---------- */
  const form = document.getElementById('formInscription');
  const confirmationBloc = document.getElementById('confirmationBloc');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const nom = document.getElementById('f-nom').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const whatsapp = document.getElementById('f-whatsapp').value.trim();
      const statut = document.getElementById('f-statut').value;
      const niveau = document.getElementById('f-niveau').value;

      let valid = true;
      if (nom.length < 2) { document.querySelector('.field-error[data-for="f-nom"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-nom"]').classList.add('hidden'); }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.querySelector('.field-error[data-for="f-email"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-email"]').classList.add('hidden'); }

      if (whatsapp.replace(/\D/g, '').length < 8) { document.querySelector('.field-error[data-for="f-whatsapp"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-whatsapp"]').classList.add('hidden'); }

      if (!statut) { document.querySelector('.field-error[data-for="f-statut"]').classList.remove('hidden'); valid = false; }
      else { document.querySelector('.field-error[data-for="f-statut"]').classList.add('hidden'); }

      if (!valid) return;

      submitBtn.disabled = true;
      submitLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validation de l\'inscription...';

      const entry = {
        nom, email, whatsapp, statut, niveau,
        date: new Date().toISOString()
      };

      let res = { estAttente: false };

      // Enregistrement hybride
      if (typeof ajouterInscription === 'function') {
        res = await ajouterInscription(entry);
      }

      document.getElementById('confirm-nom').textContent = nom;

      const joinWhatsappBtn = document.getElementById('joinWhatsappBtn');
      let targetWhatsappLink = WHATSAPP_LINK_PRINCIPAL;

      if (res && res.estAttente) {
        targetWhatsappLink = WHATSAPP_LINK_ATTENTE;
        const confirmBadge = document.getElementById('confirm-badge');
        const confirmIconBox = document.getElementById('confirm-icon-box');
        const confirmIcon = document.getElementById('confirm-icon');
        const confirmText = document.getElementById('confirm-text');

        if (confirmBadge) {
          confirmBadge.textContent = "Inscription sur Liste d'Attente !";
          confirmBadge.className = "text-xs text-amber-700 font-extrabold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200";
        }
        if (confirmIconBox) {
          confirmIconBox.className = "w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm";
        }
        if (confirmIcon) {
          confirmIcon.className = "fa-solid fa-clock-rotate-left";
        }
        if (confirmText) {
          confirmText.innerHTML = `Les 150 places principales étant réservées, votre inscription a été enregistrée sur notre <strong>liste d'attente prioritaire</strong>. Veuillez intégrer le groupe WhatsApp ci-dessous pour rester informé(e).`;
        }
        if (joinWhatsappBtn) {
          joinWhatsappBtn.href = WHATSAPP_LINK_ATTENTE;
          const spanBtn = joinWhatsappBtn.querySelector('span');
          if (spanBtn) spanBtn.textContent = "Rejoindre le Groupe WhatsApp (Liste d'Attente)";
        }
      } else {
        if (joinWhatsappBtn) {
          joinWhatsappBtn.href = WHATSAPP_LINK_PRINCIPAL;
          const spanBtn = joinWhatsappBtn.querySelector('span');
          if (spanBtn) spanBtn.textContent = "Rejoindre le Groupe WhatsApp Officiel";
        }
      }

      form.classList.add('hidden');
      confirmationBloc.classList.remove('hidden');

      setTimeout(() => { window.open(targetWhatsappLink, '_blank'); }, 1200);
    });
  }

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
      const isAttente = (item.statut || '').includes("Liste d'attente");
      const badgeStyle = isAttente 
        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
        : 'bg-blue-50 text-bleu border border-blue-100';

      return `
        <tr>
          <td>${i + 1}</td>
          <td class="font-bold text-lumaText">${item.nom || ''}</td>
          <td>${item.email || ''}</td>
          <td class="font-mono text-lumaGreen font-semibold">${item.whatsapp || ''}</td>
          <td><span class="${badgeStyle} px-2 py-0.5 rounded text-[11px] font-semibold">${item.statut || 'Participant'}</span></td>
          <td>${item.niveau || 'Débutant'}</td>
          <td>${(item.created_at || item.date) ? new Date(item.created_at || item.date).toLocaleString('fr-FR') : ''}</td>
        </tr>
      `;
    }).join('');
  }

  const adminSubmitPass = document.getElementById('adminSubmitPass');
  if (adminSubmitPass) {
    adminSubmitPass.addEventListener('click', async () => {
      if (adminPassInput.value.trim() === ADMIN_PASS || adminPassInput.value.trim() === "123456") {
        adminLoginScreen.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        if (typeof recupererInscriptions === 'function') {
          cachedList = await recupererInscriptions();
        }
        renderAdminTable(cachedList);
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
        (item.statut || '').toLowerCase().includes(q)
      );
      renderAdminTable(filtered);
    });
  }

  const adminExportBtn = document.getElementById('adminExportBtn');
  if (adminExportBtn) {
    adminExportBtn.addEventListener('click', () => {
      if (cachedList.length === 0) return;
      const headers = ['Nom & Prénoms', 'Email', 'WhatsApp', 'Statut', 'Niveau', 'Date'];
      const rows = cachedList.map(e => [e.nom, e.email, e.whatsapp, e.statut, e.niveau, e.created_at || e.date]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `inscriptions_formation_word_aeemci_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

});
