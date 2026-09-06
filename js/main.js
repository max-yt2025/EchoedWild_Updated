// main.js — dynamic site behavior
(function() {
  console.log('main.js loading...');
  
  // Use embedded animal data from animals-data.js
  let animals = window.animalsData || [];
  console.log(`Loaded ${animals.length} animals from embedded database`);
  
  if (animals.length === 0) {
    console.error('No animals loaded! Check if animals-data.js is loaded correctly.');
    setTimeout(() => {
      const resultsCount = document.getElementById('resultsCount');
      if (resultsCount) resultsCount.textContent = 'Error loading animals';
    }, 100);
    return;
  }

  function initSite() {
    console.log('Initializing site with', animals.length, 'animals');

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

    // populate featured (homepage)
    const featuredGrid = document.getElementById('featuredGrid');
    if (featuredGrid && animals.length) {
      featuredGrid.innerHTML = '';
      animals.slice(0, 6).forEach(a => featuredGrid.appendChild(createCard(a)));
    }

    // populate animals list page
    const animalsGrid = document.getElementById('animalsGrid');
    const listSearch = document.getElementById('listSearch');
    const statusFilter = document.getElementById('statusFilter');
    const regionFilter = document.getElementById('regionFilter');
    const clearFilters = document.getElementById('clearFilters');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    const resetSearch = document.getElementById('resetSearch');

    function renderList(data) {
      if (!animalsGrid) return;
      animalsGrid.innerHTML = '';
      
      if (!data.length) {
        if (noResults) noResults.style.display = 'block';
        resultsCount && (resultsCount.textContent = '0 species');
        return;
      }
      
      if (noResults) noResults.style.display = 'none';
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
          const hay = (a.name + ' ' + (a.habitat || '') + ' ' + (a.threats || []).join(' ') + ' ' + (a.region || '') + ' ' + a.status).toLowerCase();
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
      
      resetSearch && resetSearch.addEventListener('click', () => {
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
        if (ls) { 
          ls.value = query; 
          setTimeout(() => ls.dispatchEvent(new Event('input')), 100);
        }
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
    if (statusTable && animals.length) {
      const sortedAnimals = [...animals].sort((a, b) => {
        const statusOrder = ['Critically Endangered', 'Endangered', 'Vulnerable', 'Near Threatened', 'Least Concern'];
        const aIndex = statusOrder.indexOf(a.status);
        const bIndex = statusOrder.indexOf(b.status);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      
      statusTable.innerHTML = sortedAnimals.map(a => `
        <tr>
          <td><strong>${escapeHtml(a.name)}</strong></td>
          <td><span class="status ${statusClass(a.status)}">${escapeHtml(a.status)}</span></td>
          <td>${escapeHtml(a.region || '—')}</td>
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

    // Cookie popup handling
    const cookiePopup = document.getElementById('cookiePopup');
    const closeCookie = document.getElementById('closeCookie');
    const acceptCookies = document.getElementById('acceptCookies');
    const declineCookies = document.getElementById('declineCookies');

    if (cookiePopup) {
      const cookieChoice = localStorage.getItem('cookieChoice');
      if (cookieChoice) {
        cookiePopup.style.display = 'none';
      }

      closeCookie && closeCookie.addEventListener('click', () => {
        cookiePopup.style.display = 'none';
      });

      acceptCookies && acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookieChoice', 'accepted');
        cookiePopup.style.display = 'none';
      });

      declineCookies && declineCookies.addEventListener('click', () => {
        localStorage.setItem('cookieChoice', 'declined');
        cookiePopup.style.display = 'none';
      });
    }

    // Custom cursor
    const cursorInner = document.getElementById('cursor-inner');
    const cursorOuter = document.getElementById('cursor-outer');

    if (cursorInner && cursorOuter && window.matchMedia('(hover: hover)').matches) {
      document.addEventListener('mousemove', (e) => {
        cursorInner.style.left = e.clientX + 'px';
        cursorInner.style.top = e.clientY + 'px';
        
        setTimeout(() => {
          cursorOuter.style.left = e.clientX + 'px';
          cursorOuter.style.top = e.clientY + 'px';
        }, 50);
      });

      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
          cursorOuter.style.transform = 'translate(-50%, -50%) scale(1.5)';
          cursorOuter.style.borderColor = 'var(--accent-2)';
        });
        el.addEventListener('mouseleave', () => {
          cursorOuter.style.transform = 'translate(-50%, -50%) scale(1)';
          cursorOuter.style.borderColor = 'var(--accent)';
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite);
  } else {
    initSite();
  }

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
          <p><strong>Region:</strong> ${escapeHtml(animal.region || '—')}</p>
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
      <div class="card-thumb"><img src="${a.image}" alt="${escapeHtml(a.name)}" loading="lazy"></div>
      <div class="card-body">
        <h3>${escapeHtml(a.name)}</h3>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="status ${statusClass(a.status)}">${escapeHtml(a.status)}</span>
          <span class="muted" style="font-weight:600">${escapeHtml(a.region || '—')}</span>
        </div>
        <p class="muted">${escapeHtml(a.habitat || 'No habitat information available')}</p>
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
    const s = status.toLowerCase();
    if (s.includes('critic')) return 'critical';
    if (s.includes('endang')) return 'endangered';
    if (s.includes('vulner')) return 'vulnerable';
    if (s.includes('near') || s.includes('threatened')) return 'near-threatened';
    return '';
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
})();