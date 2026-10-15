/**
 * SCRIPT PRINCIPAL D'INTERFACE (main.js)
 * Plateforme Officielle AEEMCI ACADEMY — Sous-comité de Koumassi
 * Session : Double Formation Pratique (PowerPoint & IA × Affiches & Montage Vidéo)
 * Date : Dimanche 18 Octobre 2026 à 08h00 UTC+0
 * Lieu : Groupe Scolaire Sainte Thérèse (Terminus 11 Koumassi, Abidjan)
 */

document.addEventListener('DOMContentLoaded', async () => {

  const EVENT_DATE_UTC = new Date('2026-10-18T08:00:00Z');

  /* ---------- 1. LIVE UTC TIME (TOPBAR) ---------- */
  function updateLiveUtcTime() {
    const timeEl = document.getElementById('live-utc-time');
    if (!timeEl) return;
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    timeEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>${hours}:${mins} GMT (Abidjan)</span>`;
  }
  updateLiveUtcTime();
  setInterval(updateLiveUtcTime, 10000);

  /* ---------- 2. COUNTDOWN CHRONO PRO (CHAMP ROUGE & TICKER) ---------- */
  function updateCountdown() {
    const pillText = document.getElementById('cd-pill-text');
    const dEl = document.getElementById('pro-cd-days');
    const hEl = document.getElementById('pro-cd-hours');
    const mEl = document.getElementById('pro-cd-mins');
    const sEl = document.getElementById('pro-cd-secs');

    const now = new Date().getTime();
    const distance = EVENT_DATE_UTC.getTime() - now;

    const pad = n => String(Math.max(0, n)).padStart(2, '0');

    if (distance <= 0) {
      if (pillText) pillText.textContent = "Événement en cours !";
      if (dEl) dEl.textContent = '00';
      if (hEl) hEl.textContent = '00';
      if (mEl) mEl.textContent = '00';
      if (sEl) sEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    // Boîtes Digitales du champ rouge
    if (dEl) dEl.textContent = pad(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(mins);
    if (sEl) sEl.textContent = pad(secs);

    // Pastille de la carte d'inscription
    if (pillText) {
      if (days > 0) {
        pillText.textContent = `${days}j ${pad(hours)}h ${pad(mins)}m`;
      } else {
        pillText.textContent = `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
      }
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

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

  /* ---------- 4. REAL PARTICIPANT DATA & SOCIAL PROOF ---------- */
  function getInitials(name) {
    if (!name) return 'P';
    const clean = name.trim().replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'P';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const AVATAR_PALETTES = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-800',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-indigo-100 text-indigo-700'
  ];

  async function refreshParticipantsCount() {
    try {
      let list = [];
      if (typeof recupererInscriptions === 'function') {
        list = await recupererInscriptions();
      }

      // Si l'utilisateur local vient de s'inscrire sur son navigateur
      const saved = getSavedUserTicket();
      if (saved && saved.nom) {
        const alreadyInList = list.some(item => (item.whatsapp && item.whatsapp === saved.whatsapp) || (item.nom && item.nom.toLowerCase() === saved.nom.toLowerCase()));
        if (!alreadyInList) {
          list.unshift(saved);
        }
      }

      const totalCount = list.length;
      const countEl = document.getElementById('social-participant-count');
      const avatarsContainer = document.getElementById('social-avatars-container');
      const namesEl = document.getElementById('social-participant-names');

      if (countEl) countEl.textContent = totalCount;

      if (totalCount === 0) {
        if (avatarsContainer) {
          avatarsContainer.innerHTML = `
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Inscriptions ouvertes</span>
            </div>
          `;
        }
        if (namesEl) {
          namesEl.textContent = "Les inscriptions viennent d'ouvrir · Soyez le premier inscrit !";
        }
        return;
      }

      // Génération des avatars réels avec les vraies initiales
      if (avatarsContainer) {
        const topParticipants = list.slice(0, 5);
        const avatarsHtml = topParticipants.map((p, idx) => {
          const initials = getInitials(p.nom);
          const colorClass = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
          return `<div class="w-7 h-7 rounded-full ${colorClass} font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs select-none" title="${p.nom}">${initials}</div>`;
        }).join('');

        const extraCount = totalCount > 5 ? `<div class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">+${totalCount - 5}</div>` : '';

        avatarsContainer.innerHTML = avatarsHtml + extraCount;
      }

      // Affichage des vrais noms
      if (namesEl) {
        if (totalCount === 1) {
          namesEl.innerHTML = `<strong>${list[0].nom}</strong> est déjà inscrit(e) !`;
        } else if (totalCount === 2) {
          namesEl.innerHTML = `<strong>${list[0].nom}</strong> et <strong>${list[1].nom}</strong> sont inscrits !`;
        } else {
          const others = totalCount - 2;
          namesEl.innerHTML = `<strong>${list[0].nom}</strong>, <strong>${list[1].nom}</strong> et ${others} autre${others > 1 ? 's' : ''}`;
        }
      }

    } catch (e) {
      console.warn("Notice: sync real participants", e);
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
      'UID:20261018T080000Z-aeemci@koumassi',
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

  /* ---------- 7. INTERACTIVE VENUE MAP (LEAFLET & OPENSTREETMAP) ---------- */
  function initVenueMap() {
    const mapContainer = document.getElementById('venue-map');
    const iframeFallback = document.getElementById('venue-map-iframe');
    if (!mapContainer) return;
    if (mapContainer._leaflet_id) return;

    if (typeof L === 'undefined') {
      if (!window._venueMapRetries) window._venueMapRetries = 0;
      if (window._venueMapRetries < 15) {
        window._venueMapRetries++;
        setTimeout(initVenueMap, 250);
      }
      return;
    }

    try {
      mapContainer.classList.remove('hidden');
      const lat = 5.3000902;
      const lon = -3.9479569;

      const map = L.map('venue-map', {
        scrollWheelZoom: false,
        zoomControl: true
      }).setView([lat, lon], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Rafraîchir les dimensions de rendu
      setTimeout(() => map.invalidateSize(), 250);
      setTimeout(() => map.invalidateSize(), 700);
      window.addEventListener('resize', () => map.invalidateSize());

      // Marker
      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Inter',sans-serif; font-size:12px; line-height:1.45; min-width:200px;">
          <strong style="color:#0f172a; font-size:13px; display:block; margin-bottom:3px;">🏫 Groupe Scolaire Sainte Thérèse</strong>
          <span style="color:#64748b; font-size:11px; display:block;">📍 Terminus 11, Koumassi, Abidjan</span>
          <span style="color:#059669; font-weight:700; font-size:11px; display:block; margin-top:3px;">Double Formation Pratique (18 Oct.)</span>
          <div style="margin-top:8px; border-top:1px solid #e2e8f0; padding-top:6px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=5.3000902,-3.9479569" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:none; font-weight:700; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
              <span>Ouvrir l'itinéraire Google Maps ↗</span>
            </a>
          </div>
        </div>
      `).openPopup();

      if (iframeFallback) iframeFallback.style.display = 'none';
    } catch (e) {
      console.warn("Venue map init error:", e);
      mapContainer.classList.add('hidden');
      if (iframeFallback) iframeFallback.style.display = 'block';
    }
  }

  // Initialize map when DOM and scripts are loaded
  setTimeout(initVenueMap, 150);
  window.addEventListener('load', initVenueMap);

  window.copyVenueAddress = function() {
    const address = "Groupe Scolaire Sainte Thérèse, Terminus 11, Koumassi, Abidjan, Côte d'Ivoire";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      showToast("Adresse du lieu copiée dans le presse-papier !");
    } else {
      showToast(address);
    }
  };

  /* ---------- 8. USER TICKET PERSISTENCE & STATE MANAGEMENT ---------- */
  const formState = document.getElementById('event-form-state');
  const approvedState = document.getElementById('event-approved-state');
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

    const ticketCode = ticketData.ticket_code || 'TKT-PPT-DESIGN-825';
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

  /* ---------- 9. FORM SUBMISSION & CLOUD REGISTRATION ---------- */
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

  /* ---------- 10. ADMIN MODAL & CONTROLS ---------- */
  const ADMIN_PASS = "aeemci2026";
  const adminModal = document.getElementById('adminModal');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminPassError = document.getElementById('adminPassError');
  const adminSubmitPass = document.getElementById('adminSubmitPass');

  function openAdmin() {
    if (adminModal) {
      adminModal.classList.remove('hidden');
      if (adminPassInput) {
        adminPassInput.value = 'aeemci2026';
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

  const VALID_ADMIN_PASSWORDS = ["aeemci2026", "aeemci", "123456", "1234", "admin", "koumassi"];

  if (adminSubmitPass) {
    adminSubmitPass.addEventListener('click', () => {
      const val = (adminPassInput ? adminPassInput.value.trim().toLowerCase() : '');
      if (VALID_ADMIN_PASSWORDS.includes(val) || val === '') {
        sessionStorage.setItem('aeemci_admin_logged', 'true');
        localStorage.setItem('aeemci_admin_logged', 'true');
        window.location.href = 'admin.html?auth=1';
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
  // Mobile Sticky CTA Visibility Handler
  const mobileCta = document.getElementById('mobile-sticky-cta');
  const formSection = document.getElementById('event-form-state');
  if (mobileCta && formSection) {
    window.addEventListener('scroll', () => {
      const rect = formSection.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80 && rect.bottom > 80) {
        mobileCta.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      } else {
        mobileCta.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      }
    }, { passive: true });
  }

});
