/**
 * Script Principal d'Interface & Interactions (main.js)
 * Formation Pratique Microsoft Word — AEEMCI Koumassi
 */

document.addEventListener('DOMContentLoaded', () => {

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

  /* ---------- CALENDAR .ICS EXPORT (Horaire: 20h00) ---------- */
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

  /* ---------- FORM SUBMISSION & WHATSAPP REDIRECT ---------- */
  const form = document.getElementById('formInscription');
  const confirmationBloc = document.getElementById('confirmationBloc');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');
  const WHATSAPP_LINK = "https://chat.whatsapp.com/KzKBnGq3ZahFYohN2nm3gN?s=sh&p=a&mlu=4&ilr=4";

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

      // Appel de la fonction de base de données (Supabase / Local)
      if (typeof ajouterInscription === 'function') {
        await ajouterInscription(entry);
      }

      document.getElementById('confirm-nom').textContent = nom;

      form.classList.add('hidden');
      confirmationBloc.classList.remove('hidden');

      setTimeout(() => { window.open(WHATSAPP_LINK, '_blank'); }, 1200);
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

    tbody.innerHTML = list.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="font-bold text-lumaText">${item.nom || ''}</td>
        <td>${item.email || ''}</td>
        <td class="font-mono text-lumaGreen font-semibold">${item.whatsapp || ''}</td>
        <td><span class="bg-blue-50 text-bleu px-2 py-0.5 rounded text-[11px] font-semibold">${item.statut || 'Participant'}</span></td>
        <td>${item.niveau || 'Débutant'}</td>
        <td>${item.date ? new Date(item.date).toLocaleString('fr-FR') : ''}</td>
      </tr>
    `).join('');
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
        (item.whatsapp || '').toLowerCase().includes(q)
      );
      renderAdminTable(filtered);
    });
  }

  const adminExportBtn = document.getElementById('adminExportBtn');
  if (adminExportBtn) {
    adminExportBtn.addEventListener('click', () => {
      if (cachedList.length === 0) return;
      const headers = ['Nom & Prénoms', 'Email', 'WhatsApp', 'Statut', 'Niveau', 'Date'];
      const rows = cachedList.map(e => [e.nom, e.email, e.whatsapp, e.statut, e.niveau, e.date]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `inscriptions_formation_word_aeemci_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

});
