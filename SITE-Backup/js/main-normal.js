// main.js — dynamic site behavior
document.addEventListener('DOMContentLoaded', async () => {
  // fill year spans
  ['year', 'year2', 'year3', 'year4', 'year5', 'year6', 'year7', 'year8'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = new Date().getFullYear();
  });

  // header controls
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('open');
      if (window.innerWidth < 720) nav.style.display = nav.classList.contains('open') ? 'block' : '';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (window.innerWidth < 720) { nav.classList.remove('open'); nav.style.display = ''; }
    }));
  }

  // toggle search on mobile
  const searchToggle = document.getElementById('searchToggle');
  const globalSearch = document.getElementById('globalSearch');
  if (searchToggle && globalSearch) {
    searchToggle.addEventListener('click', () => {
      globalSearch.focus();
    });
  }

  // load animals data
  const animalsUrl = 'data/animals.json';
  let animals = [];
  try {
    const res = await fetch(animalsUrl);
    animals = await res.json();
  } catch (e) {
    console.error('Failed to load animals.json', e);
  }

  // populate featured
  const featuredGrid = document.getElementById('featuredGrid');
  if (featuredGrid && animals.length) {
    animals.slice(0, 6).forEach(a => featuredGrid.appendChild(createCard(a)));
  }

  // populate animals list page
  const animalsGrid = document.getElementById('animalsGrid');
  const listSearch = document.getElementById('listSearch');
  const statusFilter = document.getElementById('statusFilter');
  const regionFilter = document.getElementById('regionFilter');
  const clearFilters = document.getElementById('clearFilters');
  const resultsCount = document.getElementById('resultsCount');

  function renderList(data) {
    if (!animalsGrid) return;
    animalsGrid.innerHTML = '';
    if (!data.length) {
      animalsGrid.innerHTML = '<div class="muted">No results — try clearing filters.</div>';
      resultsCount && (resultsCount.textContent = '0 species');
      return;
    }
    data.forEach(a => animalsGrid.appendChild(createCard(a)));
    resultsCount && (resultsCount.textContent = data.length + ' species');
  }

  if (animalsGrid) {
    renderList(animals);
    function applyFilters() {
      const q = (listSearch && listSearch.value || '').toLowerCase().trim();
      const status = (statusFilter && statusFilter.value) || '';
      const region = (regionFilter && regionFilter.value) || '';
      let out = animals.filter(a => {
        const hay = (a.name + ' ' + a.habitat + ' ' + (a.threats || []).join(' ') + ' ' + a.region + ' ' + a.status).toLowerCase();
        if (q && !hay.includes(q)) return false;
        if (status && a.status !== status) return false;
        if (region && a.region !== region) return false;
        return true;
      });
      renderList(out);
    }
    listSearch && listSearch.addEventListener('input', debounce(applyFilters, 220));
    statusFilter && statusFilter.addEventListener('change', applyFilters);
    regionFilter && regionFilter.addEventListener('change', applyFilters);
    clearFilters && clearFilters.addEventListener('click', () => {
      if (listSearch) listSearch.value = '';
      if (statusFilter) statusFilter.value = '';
      if (regionFilter) regionFilter.value = '';
      applyFilters();
    });
  }

  // index global search
  const globalSearchInput = document.getElementById('globalSearch');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = globalSearchInput.value.trim();
        if (!q) window.location.href = 'animals.html';
        else window.location.href = 'animals.html?search=' + encodeURIComponent(q);
      }
    });
    const query = new URLSearchParams(location.search).get('search');
    if (query && document.location.pathname.endsWith('animals.html')) {
      const ls = document.getElementById('listSearch');
      if (ls) { ls.value = query; ls.dispatchEvent(new Event('input')); }
    }
  }

  // single animal page (animal.html)
  const animalBio = document.getElementById('animalBio');
  if (animalBio) {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const slug = id || (location.pathname.split('/').pop().replace('.html', ''));
    const animal = animals.find(a => a.id === slug || a.slug === slug);
    if (!animal) {
      animalBio.innerHTML = '<p class="muted">Animal not found. Go back to <a href="animals.html">Animals</a>.</p>';
    } else {
      animalBio.innerHTML = getAnimalBioHTML(animal);
    }
  }

  // status tracker table
  const statusTable = document.querySelector('.status-table tbody');
  if (statusTable) {
    statusTable.innerHTML = animals.map(a => `
      <tr>
        <td>${escapeHtml(a.name)}</td>
        <td class="status ${statusClass(a.status)}">${escapeHtml(a.status)}</td>
        <td>${escapeHtml(a.estimated || '—')}</td>
      </tr>
    `).join('');
  }

  // BIO modal system
  const modal = document.createElement('div');
  modal.id = 'bioModal';
  modal.className = 'modal hidden';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <div id="modalBody"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const modalClose = modal.querySelector('.modal-close');
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function openModal(animal) {
    document.getElementById('modalBody').innerHTML = getAnimalBioHTML(animal);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.body.addEventListener('click', e => {
    if (e.target.matches('.bio-btn, .card .link')) {
      e.preventDefault();
      const id = e.target.getAttribute('data-id') || new URL(e.target.href).searchParams.get('id');
      const animal = animals.find(a => a.id === id);
      if (animal) openModal(animal);
    }
  });

  // helpers
  function getAnimalBioHTML(animal) {
    return `
      <div class="bio-grid">
        <div class="bio-media">
          <img src="${animal.image}" alt="${escapeHtml(animal.name)}">
        </div>
        <div class="bio-content">
          <h1>${escapeHtml(animal.name)}</h1>
          <div class="status ${statusClass(animal.status)}">${escapeHtml(animal.status)}</div>
          <p><strong>Estimated remaining:</strong> ${escapeHtml(animal.estimated || '—')}</p>
          <h3>Habitat</h3><p>${escapeHtml(animal.habitat || '—')}</p>
          <h3>Threats</h3><ul>${(animal.threats || []).map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
          <h3>Conservation efforts</h3><ul>${(animal.conservation || []).map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        </div>
      </div>
    `;
  }

function createCard(a) {
  const article = document.createElement('article');
  article.className = 'card animate-up';
  article.innerHTML = `
    <div class="card-thumb"><img src="${a.image}" alt="${escapeHtml(a.name)}"></div>
    <div class="card-body">
      <h3>${escapeHtml(a.name)}</h3>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="status ${statusClass(a.status)}">${escapeHtml(a.status)}</div>
        <div class="muted" style="font-weight:600">${escapeHtml(a.region)}</div>
      </div>
      <p class="muted">${escapeHtml(a.habitat)}</p>
      <div style="margin-top:auto;display:flex;gap:10px;align-items:center">
        ${a.link ? `<a class="btn small" href="${a.link}">View Page</a>` : ''}
        <span style="margin-left:auto;color:var(--muted);font-size:.95rem">${escapeHtml(a.estimated || '—')}</span>
      </div>
    </div>
  `;
  return article;
}


  function statusClass(status) {
    if (!status) return '';
    if (status.toLowerCase().includes('critic')) return 'critical';
    if (status.toLowerCase().includes('endang')) return 'endangered';
    if (status.toLowerCase().includes('vulner')) return 'vulnerable';
    return '';
  }
  function escapeHtml(s) { if (!s) return ''; return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
});

// Custom Cursor 
const cursorInner = document.getElementById('cursor-inner');
const cursorOuter = document.getElementById('cursor-outer');

document.addEventListener('mousemove', e => {
  cursorInner.style.left = e.clientX + 'px';
  cursorInner.style.top = e.clientY + 'px';

  cursorOuter.style.left = e.clientX + 'px';
  cursorOuter.style.top = e.clientY + 'px';
});

// Background Music
window.addEventListener('DOMContentLoaded', () => {
  (function loadElfsightMusic() {
    const script = document.createElement('script');
    script.src = "https://static.elfsight.com/platform/platform.js";
    script.async = true;
    document.body.appendChild(script);

    const div = document.createElement('div');
    div.className = "elfsight-app-e20e946d-b400-4a60-b1aa-493ba934c72c";
    div.setAttribute("data-elfsight-app-lazy", "");
    document.body.appendChild(div);
  })();
});

// ChatGPT AI HELPER
  window.addEventListener('DOMContentLoaded', () => {
    (function loadElfsightChatbot() {
      // Load Elfsight platform script
      const script = document.createElement('script');
      script.src = "https://static.elfsight.com/platform/platform.js";
      script.async = true;
      document.body.appendChild(script);

      // Create chatbot container
      const chatbotDiv = document.createElement('div');
      chatbotDiv.className = "elfsight-app-bcbae895-b755-4186-b6ff-91b6549de863";
      chatbotDiv.setAttribute("data-elfsight-app-lazy", "");
      document.body.appendChild(chatbotDiv);
    })();
  });

// Cookies POPUP UI
  const popup = document.getElementById('cookiePopup');
  const acceptBtn = document.getElementById('acceptCookies');
  const declineBtn = document.getElementById('declineCookies');
  const closeBtn = document.getElementById('closeCookie');

  // Show popup if no choice stored
  if (!localStorage.getItem('cookieConsent')) {
    popup.style.display = 'block';
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    popup.style.display = 'none';
  });

  declineBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    popup.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });

// Elfsight Countdown Timer
window.addEventListener('DOMContentLoaded', () => {
  (function loadElfsightCountdown() {
    // Load Elfsight platform script
    const script = document.createElement('script');
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    // Create countdown container
    const countdownDiv = document.createElement('div');
    countdownDiv.className = "elfsight-app-b711b4b1-7e26-4a00-813a-540ac42ecd1d";
    countdownDiv.setAttribute("data-elfsight-app-lazy", "");
    document.body.appendChild(countdownDiv);
  })();
});

// Website Translator
window.addEventListener('DOMContentLoaded', () => {
  (function loadElfsightTranslator() {
    const script = document.createElement('script');
    script.src = "https://static.elfsight.com/platform/platform.js";
    script.async = true;
    document.body.appendChild(script);

    const div = document.createElement('div');
    div.className = "elfsight-app-382038fb-e338-47f3-8024-5b3946054098";
    div.setAttribute("data-elfsight-app-lazy", "");
    document.body.appendChild(div);
  })();
});

document.addEventListener("DOMContentLoaded", function () {
  // Inject popup HTML into body
  const popupHTML = `
    <div id="cashapp-donation" class="popup-overlay">
      <div class="popup-box">
        <h2>Support the Developer</h2>
        <p>Would you like to donate <strong>$1</strong> to the developer?</p>
        <p class="cashapp-tag">CashApp: <span>$3003435A</span></p>
        <div class="popup-buttons">
          <button id="donate-btn">Donate</button>
          <button id="decide-btn">Decide</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", popupHTML);

  // Show popup (you can delay or trigger this however you want)
  document.getElementById("cashapp-donation").style.display = "flex";

  // Button actions
  document.getElementById("donate-btn").addEventListener("click", function () {
    window.open("https://cash.app/$3003435A/1", "_blank");
    document.getElementById("cashapp-donation").style.display = "none";
  });

  document.getElementById("decide-btn").addEventListener("click", function () {
    document.getElementById("cashapp-donation").style.display = "none";
  });
});
