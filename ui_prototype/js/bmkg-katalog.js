/**
 * Portal Open Data BMKG — Catalog Dataset Engine & Facet Search Controller
 * Modules: In-Memory Datasets, Faceted Filtering, Live Search, Dynamic Cards Renderer, Facet Counters.
 */

// ==========================================================================
// 1. SEED DATA & PILAR CONFIGURATION
// ==========================================================================
const SEED_DATASETS = [
  {
    id: 'cuaca-harian-cengkareng',
    pilar: 'meteorologi',
    formats: ['csv'],
    org: 'balai2',
    time: 'harian',
    title: 'Data Observasi Cuaca Harian Permukaan Stasiun Soekarno-Hatta (WMO: 96749) Tahun 2026',
    description: 'Dataset time-series rekaman harian parameter atmosfer permukaan meliputi suhu minimum, suhu maksimum, suhu rata-rata, kelembapan nisbi udara, kecepatan angin maksimum, dan curah hujan harian terkalibrasi.',
    producer: 'Stasiun Meteorologi Kelas I Soekarno-Hatta (BBMKG Wilayah II)',
    temporalRange: '01 Agu 2026 – 31 Agu 2026',
    datastoreActive: true
  }
];

const PILAR_CONFIG = {
  'meteorologi':    { cls: 'met',  icon: 'fa-cloud-sun',        label: 'Meteorologi' },
  'klimatologi':    { cls: 'klim', icon: 'fa-temperature-half', label: 'Klimatologi' },
  'geofisika':      { cls: 'geo',  icon: 'fa-volcano',          label: 'Geofisika' },
  'kualitas-udara': { cls: 'ku',   icon: 'fa-wind',             label: 'Kualitas Udara' }
};

const STORAGE_KEY = 'bmkg_datasets';

// ==========================================================================
// 2. REPOSITORY & PERSISTENCE HELPERS
// ==========================================================================
function getDatasets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATASETS));
    return [...SEED_DATASETS];
  }
  try {
    return JSON.parse(raw);
  } catch (_) {
    return [...SEED_DATASETS];
  }
}

function saveDatasets(datasets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

// ==========================================================================
// 3. RENDER DATASET CARDS
// ==========================================================================
function renderDatasetCards() {
  const container = document.getElementById('datasetListContainer');
  if (!container) return;

  const datasets = getDatasets();
  container.innerHTML = '';

  if (datasets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; display: block; color: var(--border-medium);"></i>
        <p style="font-size: 1.05rem; font-weight: 600;">Belum ada dataset tersedia</p>
        <p style="font-size: 0.85rem;">Dataset akan muncul setelah admin menginput data melalui panel admin.</p>
      </div>
    `;
    const resEl = document.getElementById('datasetResultCount');
    const totEl = document.getElementById('datasetTotalCount');
    if (resEl) resEl.textContent = '0';
    if (totEl) totEl.textContent = '0';
    return;
  }

  datasets.forEach(ds => {
    const pilarInfo = PILAR_CONFIG[ds.pilar] || { cls: 'met', icon: 'fa-database', label: ds.pilar };

    const formatBadges = (ds.formats || []).map(f =>
      `<span class="format-badge ${escapeHtml(f.toLowerCase())}">${escapeHtml(f.toUpperCase())}</span>`
    ).join('');

    const datastoreBadge = ds.datastoreActive
      ? `<span style="font-size: 0.76rem; color: var(--bmkg-green-dark); font-weight: 700; background: var(--bmkg-green-light); padding: 2px 8px; border-radius: 4px;">
           <i class="fa-solid fa-database"></i> DataStore API Aktif
         </span>`
      : '';

    const cardHTML = `
      <article class="dataset-card" data-pilar="${escapeHtml(ds.pilar)}" data-format="${escapeHtml((ds.formats || []).join(' '))}" data-org="${escapeHtml(ds.org || '')}" data-time="${escapeHtml(ds.time || '')}">
        <div class="card-top-meta">
          <span class="pillar-tag ${pilarInfo.cls}"><i class="fa-solid ${pilarInfo.icon}"></i> ${escapeHtml(pilarInfo.label)}</span>
          <span class="org-producer-text"><i class="fa-solid fa-building"></i> ${escapeHtml(ds.producer || '-')}</span>
        </div>

        <a href="#" class="dataset-card-title" onclick="openDatasetDetail('${escapeHtml(ds.id)}')">
          ${escapeHtml(ds.title)}
        </a>

        <p class="dataset-card-description">
          ${escapeHtml(ds.description)}
        </p>

        <div class="card-bottom-row">
          <div class="format-pills-group">
            ${formatBadges}
            ${datastoreBadge}
          </div>

          <div class="temporal-range-tag">
            <i class="fa-regular fa-calendar"></i> ${escapeHtml(ds.temporalRange || '-')}
          </div>

          <div class="card-action-links">
            <button class="btn-interactive card-sub-btn" onclick="showToast('Membuka Pratinjau Tabel DataStore...')">
              <i class="fa-solid fa-table-cells"></i> Pratinjau
            </button>
            <button class="btn-interactive card-sub-btn" onclick="showToast('Mengunduh berkas...')">
              <i class="fa-solid fa-download"></i> Unduh
            </button>
          </div>
        </div>
      </article>
    `;

    container.innerHTML += cardHTML;
  });

  const totEl = document.getElementById('datasetTotalCount');
  const resEl = document.getElementById('datasetResultCount');
  if (totEl) totEl.textContent = datasets.length;
  if (resEl) resEl.textContent = datasets.length;
}

// ==========================================================================
// 4. UPDATE FACET COUNTERS
// ==========================================================================
function updateFacetCounts() {
  const datasets = getDatasets();

  function countBy(field, value) {
    return datasets.filter(ds => {
      if (field === 'formats') {
        return (ds.formats || []).map(f => f.toLowerCase()).includes(value);
      }
      return (ds[field] || '') === value;
    }).length;
  }

  ['meteorologi', 'klimatologi', 'geofisika', 'kualitas-udara'].forEach(v => {
    const el = document.getElementById(`count-pilar-${v}`);
    if (el) el.textContent = countBy('pilar', v);
  });

  ['csv', 'geojson', 'netcdf', 'kml'].forEach(v => {
    const el = document.getElementById(`count-format-${v}`);
    if (el) el.textContent = countBy('formats', v);
  });

  ['pusat', 'balai1', 'balai2', 'balai3', 'balai4', 'balai5'].forEach(v => {
    const el = document.getElementById(`count-org-${v}`);
    if (el) el.textContent = countBy('org', v);
  });

  ['harian', 'jam', 'dasarian', 'bulanan'].forEach(v => {
    const el = document.getElementById(`count-time-${v}`);
    if (el) el.textContent = countBy('time', v);
  });
}

// ==========================================================================
// 5. LIVE FILTER & SEARCH CONTROLLER
// ==========================================================================
function applyFilterAndSearch() {
  const searchInputEl = document.getElementById('catalogSearchInput');
  const searchInput = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';
  
  const selectedPilars = Array.from(document.querySelectorAll('.facet-pilar:checked')).map(cb => cb.value);
  const selectedFormats = Array.from(document.querySelectorAll('.facet-format:checked')).map(cb => cb.value);
  const selectedOrgs = Array.from(document.querySelectorAll('.facet-org:checked')).map(cb => cb.value);
  const selectedTimes = Array.from(document.querySelectorAll('.facet-time:checked')).map(cb => cb.value);

  const cards = document.querySelectorAll('.dataset-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const titleEl = card.querySelector('.dataset-card-title');
    const descEl = card.querySelector('.dataset-card-description');
    const title = titleEl ? titleEl.textContent.toLowerCase() : '';
    const desc = descEl ? descEl.textContent.toLowerCase() : '';
    const pilar = card.getAttribute('data-pilar') || '';
    const formats = (card.getAttribute('data-format') || '').split(' ');
    const org = card.getAttribute('data-org') || '';
    const time = card.getAttribute('data-time') || '';

    const matchesText = !searchInput || title.includes(searchInput) || desc.includes(searchInput);
    const matchesPilar = selectedPilars.length === 0 || selectedPilars.includes(pilar);
    const matchesFormat = selectedFormats.length === 0 || selectedFormats.some(f => formats.includes(f));
    const matchesOrg = selectedOrgs.length === 0 || selectedOrgs.includes(org);
    const matchesTime = selectedTimes.length === 0 || selectedTimes.includes(time);

    if (matchesText && matchesPilar && matchesFormat && matchesOrg && matchesTime) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const resCountEl = document.getElementById('datasetResultCount');
  if (resCountEl) resCountEl.textContent = visibleCount;

  renderActiveChips(selectedPilars, selectedFormats, selectedOrgs, selectedTimes, searchInput);
}

function renderActiveChips(pilars, formats, orgs, times, searchInput) {
  const container = document.getElementById('activeChipsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (searchInput) {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Kata Kunci: "${escapeHtml(searchInput)}"</span>
        <button onclick="clearSearchInput()"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `;
  }

  pilars.forEach(p => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Pilar: ${escapeHtml(p.toUpperCase())}</span>
        <button onclick="uncheckFacet('facet-pilar', '${escapeHtml(p)}')"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `;
  });

  formats.forEach(f => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Format: ${escapeHtml(f.toUpperCase())}</span>
        <button onclick="uncheckFacet('facet-format', '${escapeHtml(f)}')"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `;
  });

  orgs.forEach(o => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Unit: ${escapeHtml(o.toUpperCase())}</span>
        <button onclick="uncheckFacet('facet-org', '${escapeHtml(o)}')"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `;
  });

  times.forEach(t => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Waktu: ${escapeHtml(t.toUpperCase())}</span>
        <button onclick="uncheckFacet('facet-time', '${escapeHtml(t)}')"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `;
  });
}

function clearSearchInput() {
  const el = document.getElementById('catalogSearchInput');
  if (el) el.value = '';
  applyFilterAndSearch();
}

function uncheckFacet(className, val) {
  const cb = document.querySelector(`.${className}[value="${val}"]`);
  if (cb) {
    cb.checked = false;
    applyFilterAndSearch();
  }
}

function resetAllFilters() {
  const searchEl = document.getElementById('catalogSearchInput');
  if (searchEl) searchEl.value = '';
  document.querySelectorAll('.facet-pilar, .facet-format, .facet-org, .facet-time').forEach(cb => cb.checked = false);
  applyFilterAndSearch();
  showToast('Seluruh filter telah di-reset');
}

function applySorting(sortVal) {
  showToast(`Mengurutkan dataset berdasarkan: ${sortVal}`);
}

function toggleSpatialFilter() {
  showToast('Membuka modal seleksi Bounding Box (ckanext-spatial)');
}

function openDatasetDetail(datasetId) {
  showToast(`Membuka halaman detail dataset: ${datasetId}`);
}

function initUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const pilar = urlParams.get('pilar');
  let shouldFilter = false;

  if (q) {
    const searchEl = document.getElementById('catalogSearchInput');
    if (searchEl) {
      searchEl.value = q;
      shouldFilter = true;
    }
  }

  if (pilar) {
    const pilarCb = document.querySelector(`.facet-pilar[value="${pilar}"]`);
    if (pilarCb) {
      pilarCb.checked = true;
      shouldFilter = true;
    }
  }

  if (shouldFilter) {
    applyFilterAndSearch();
  }
}

// ==========================================================================
// 6. INITIALIZATION & STORAGE SYNC
// ==========================================================================
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    renderDatasetCards();
    updateFacetCounts();
    applyFilterAndSearch();
  }
});

function initKatalogPage() {
  renderDatasetCards();
  updateFacetCounts();
  initUrlParams();
}
