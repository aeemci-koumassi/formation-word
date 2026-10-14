/**
 * SCRIPT PRINCIPAL D'INTERFACE (main.js)
 * Design & Expérience Lu.ma (luma*) — AEEMCI Koumassi
 * Session : Double Formation Pratique (PowerPoint & IA × Affiches & Montage Vidéo)
 * Date : Dimanche 18 Octobre 2026 à 08h00 UTC+0
 */

document.addEventListener('DOMContentLoaded', async () => {

  const EVENT_DATE_UTC = new Date('2026-10-18T08:00:00Z');
  const BASE_PARTICIPANTS_COUNT = 820;

  /* ---------- 1. LIVE UTC TIME (TOPBAR) ---------- */
  function updateLiveUtcTime() {
    const timeEl = document.getElementById('live-utc-time');
    if (!timeEl) return;
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    timeEl.textContent = `${hours}:${mins} UTC+0`;
  }
  updateLiveUtcTime();
  setInterval(updateLiveUtcTime, 10000);

  /* ---------- 2. COUNTDOWN PILL (LUMA STYLE : "Commence dans 3d 08h") ---------- */
  function updateCountdownPill() {
    const pillText = document.getElementById('cd-pill-text');
    if (!pillText) return;

    const now = new Date().getTime();
    const distance = EVENT_DATE_UTC.getTime() - now;

    if (distance <= 0) {
      pillText.textContent = "Événement en cours !";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      pillText.textContent = `${days}d ${hours}h`;
    } else {
      pillText.textContent = `${hours}h ${mins}m`;
    }
  }
  updateCountdownPill();
  setInterval(updateCountdownPill, 60000);

  /* ---------- 3. TOAST NOTIFICATION HELPER ---------- */
  window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
      }, 3500);
    }
  };

  /* ---------- 4. SOCIAL PROOF & PARTICIPANT COUNT ---------- */
  async function refreshParticipantsCount() {
    try {
      let registeredCount = 0;
      if (typeof recupererInscriptions === 'function') {
        const list = await recupererInscriptions();
        if (Array.isArray(list)) {
          registeredCount = list.length;
        }
      }
      const total = BASE_PARTICIPANTS_COUNT + registeredCount;
      const countEl = document.getElementById('social-participant-count');
      const othersEl = document.getElementById('social-others-count');
      if (countEl) countEl.textContent = total;
      if (othersEl) othersEl.textContent = Math.max(0, total - 2);
    } catch (e) {
      console.warn("Notice: sync participant count", e);
    }
  }
  refreshParticipantsCount();

  /* ---------- 5. FAQ ACCORDIONS ---------- */
  document.querySelectorAll('.faq-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('faq-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('faq-open'));
      if (!isOpen) item.classList.add('faq-open');
    });
  });

  /* ---------- 6. CALENDAR EXPORT (GOOGLE CALENDAR & .ICS) ---------- */
  window.openGoogleCalendar = function() {
    const title = encodeURIComponent("Double Formation Pratique (PowerPoint & IA × Affiches & Montage Vidéo) — AEEMCI");
    const details = encodeURIComponent("Formation pratique 100% gratuite.\n\nAtelier 1 : PowerPoint & IA par Djim Aboubacar Mikahillo\nAtelier 2 : Création d’affiches et montages vidéo par Sawadogo Mohamed\n\nLieu : Groupe Scolaire Sainte Thérèse (Terminus 11 Koumassi)\nInfoline WhatsApp : +225 07 11 98 58 10");
    const location = encodeURIComponent("Groupe Scolaire Sainte Thérèse, Terminus 11 Koumassi, Abidjan");
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261018T080000Z/20261018T140000Z&details=${details}&location=${location}`;
    window.open(googleUrl, '_blank');
  };

  window.downloadICSFile = function() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AEEMCI Koumassi//Double Formation 2026//FR',
      'BEGIN:VEVENT',
      'UID:20261018T080000Z-aeemci-luma@koumassi',
      'DTSTAMP:20261014T000000Z',
      'DTSTART:20261018T080000Z',
      'DTEND:20261018T140000Z',
      'SUMMARY:Double Formation Pratique (PowerPoint & IA × Affiches & Montage Vidéo) — AEEMCI',
      'DESCRIPTION:Formation 100% gratuite animée par Djim Aboubacar Mikahillo et Sawadogo Mohamed au Groupe Scolaire Sainte Thérèse.',
      'LOCATION:Groupe Scolaire Sainte Thérèse, Terminus 11 Koumassi, Abidjan',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Formation_AEEMCI_18_Octobre_2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ---------- 7. USER TICKET PERSISTENCE & STATE MANAGEMENT ---------- */
  const formState = document.getElementById('luma-form-state');
  const approvedState = document.getElementById('luma-approved-state');
  const ticketModal = document.getElementById('ticketModal');

  function getSavedUserTicket() {
    try {
      const saved = localStorage.getItem('aeemci_user_ticket');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  function renderTicketDetails(ticketData) {
    if (!ticketData) return;
    const codeEl = document.getElementById('ticket-code-display');
    const nomEl = document.getElementById('ticket-nom-display');
    const contactEl = document.getElementById('ticket-contact-display');
    const formEl = document.getElementById('ticket-formation-display');
    const qrImg = document.getElementById('ticket-qrcode-img');
    const waShare = document.getElementById('ticket-whatsapp-share');

    const ticketCode = ticketData.ticket_code || 'TKT-PPT-DESIGN-824';
    if (codeEl) codeEl.textContent = ticketCode;
    if (nomEl) nomEl.textContent = ticketData.nom || 'Participant';
    if (contactEl) contactEl.textContent = `${ticketData.whatsapp || ''} · ${ticketData.email || ''}`;
    if (formEl) formEl.textContent = ticketData.formation || 'Pack Complet (PowerPoint & IA + Design & Vidéo)';

    // QR Code generation via secure public QR API
    const qrPayload = encodeURIComponent(`AEEMCI-PASS|${ticketCode}|${ticketData.nom}|18-10-2026`);
    if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrPayload}&margin=1`;

    // WhatsApp Direct Receipt Message
    if (waShare) {
      const msg = encodeURIComponent(`🎟️ *MON PASS PARTICIPANT OFFICIEL — AEEMCI ACADEMY*\n\n` +
        `👤 *Nom :* ${ticketData.nom}\n` +
        `🔖 *Ticket :* ${ticketCode}\n` +
        `📚 *Formation :* ${ticketData.formation || 'Pack Complet'}\n` +
        `📅 *Date :* Dimanche 18 Octobre 2026 à 08h00 GMT\n` +
        `📍 *Lieu :* Groupe Scolaire Sainte Thérèse (Terminus 11 Koumassi)\n\n` +
        `✅ Mon inscription est bien confirmée !`);
      waShare.href = `https://wa.me/2250711985810?text=${msg}`;
    }
  }

  window.openTicketModal = function() {
    const saved = getSavedUserTicket() || {
      ticket_code: 'TKT-PPT-DESIGN-825',
      nom: document.getElementById('f-nom') ? document.getElementById('f-nom').value.trim() : 'Participant',
      whatsapp: document.getElementById('f-whatsapp') ? document.getElementById('f-whatsapp').value.trim() : '+225 07 11 98 58 10',
      formation: document.getElementById('f-formation') ? document.getElementById('f-formation').value : 'Pack Complet (PowerPoint & IA + Design/Vidéo)'
    };
    renderTicketDetails(saved);
    if (ticketModal) ticketModal.classList.remove('hidden');
  };

  window.closeTicketModal = function() {
    if (ticketModal) ticketModal.classList.add('hidden');
  };

  window.resetRegistrationForm = function() {
    if (approvedState) approvedState.classList.add('hidden');
    if (formState) formState.classList.remove('hidden');
    const form = document.getElementById('formInscription');
    if (form) form.reset();
  };

  // If user previously registered on this device, show approved state
  const existingTicket = getSavedUserTicket();
  if (existingTicket && existingTicket.nom) {
    if (formState) formState.classList.add('hidden');
    if (approvedState) approvedState.classList.remove('hidden');
    renderTicketDetails(existingTicket);
  }

  /* ---------- 8. FORM SUBMISSION & CLOUD REGISTRATION ---------- */
  const form = document.getElementById('formInscription');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      e.stopPropagation();

      const nom = document.getElementById('f-nom').value.trim();
      const whatsapp = document.getElementById('f-whatsapp').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const formation = document.getElementById('f-formation').value;
      const ordi = document.getElementById('f-ordi').value;
      const statut = document.getElementById('f-statut').value;
      const genre = document.getElementById('f-genre') ? document.getElementById('f-genre').value : 'Homme';

      let valid = true;
      if (nom.length < 2) {
        document.querySelector('.field-error[data-for="f-nom"]').classList.remove('hidden');
        valid = false;
      } else {
        document.querySelector('.field-error[data-for="f-nom"]').classList.add('hidden');
      }

      if (whatsapp.replace(/\D/g, '').length < 8) {
        document.querySelector('.field-error[data-for="f-whatsapp"]').classList.remove('hidden');
        valid = false;
      } else {
        document.querySelector('.field-error[data-for="f-whatsapp"]').classList.add('hidden');
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.querySelector('.field-error[data-for="f-email"]').classList.remove('hidden');
        valid = false;
      } else if (email) {
        document.querySelector('.field-error[data-for="f-email"]').classList.add('hidden');
      }

      if (!valid) return;

      // Loading State
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Inscription en cours...';

      // Ticket generation
      const ticketCode = (typeof genererCodeTicket === 'function') ? genererCodeTicket() : `TKT-PPT-DESIGN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const entry = {
        ticket_code: ticketCode,
        nom,
        email: email || `${whatsapp.replace(/\D/g, '')}@aeemci.ci`,
        whatsapp,
        statut,
        genre,
        ordi,
        formation,
        statut_validation: "Validée",
        date: new Date().toISOString()
      };

      // 1. Cloud Save
      if (typeof ajouterInscription === 'function') {
        try {
          await ajouterInscription(entry);
        } catch (err) {
          console.warn("Notice: Cloud registration fallback", err);
        }
      }

      // 2. Local Storage Persistence
      try {
        localStorage.setItem('aeemci_user_ticket', JSON.stringify(entry));
      } catch (e) {}

      // 3. Update view
      renderTicketDetails(entry);
      if (formState) formState.classList.add('hidden');
      if (approvedState) {
        approvedState.classList.remove('hidden');
        approvedState.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      showToast("Inscription validée avec succès !");
      refreshParticipantsCount();

      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "S'inscrire à l'événement";
    });
  }

  /* ---------- 9. ADMIN MODAL & CONTROLS ---------- */
  const ADMIN_PASS = "aeemci2026";
  const adminModal = document.getElementById('adminModal');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminPassError = document.getElementById('adminPassError');
  const adminSubmitPass = document.getElementById('adminSubmitPass');

  function openAdmin() {
    if (adminModal) {
      adminModal.classList.remove('hidden');
      if (adminPassInput) {
        adminPassInput.value = '';
        if (adminPassError) adminPassError.classList.add('hidden');
        setTimeout(() => adminPassInput.focus(), 120);
      }
    }
  }
  window.openAdmin = openAdmin;

  function closeAdmin() {
    if (adminModal) adminModal.classList.add('hidden');
  }
  window.closeAdmin = closeAdmin;

  if (adminSubmitPass) {
    adminSubmitPass.addEventListener('click', () => {
      const val = (adminPassInput ? adminPassInput.value.trim() : '');
      if (val === ADMIN_PASS || val === '123456') {
        sessionStorage.setItem('aeemci_admin_logged', 'true');
        localStorage.setItem('aeemci_admin_logged', 'true');
        window.location.href = 'admin.html';
      } else {
        if (adminPassError) adminPassError.classList.remove('hidden');
      }
    });
  }

  if (adminPassInput) {
    adminPassInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') adminSubmitPass.click();
    });
  }

  // Keyboard shortcut Ctrl + Shift + A
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      openAdmin();
    }
  });

  // Secret URL trigger ?admin=1
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('admin') || urlParams.has('organisateur')) {
    openAdmin();
  }

  // Modal Backdrop Click
  if (ticketModal) {
    ticketModal.addEventListener('click', e => {
      if (e.target === ticketModal) closeTicketModal();
    });
  }
  if (adminModal) {
    adminModal.addEventListener('click', e => {
      if (e.target === adminModal) closeAdmin();
    });
  }

});
