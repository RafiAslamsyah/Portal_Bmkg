/**
 * Portal Open Data BMKG — Komponen Tampilan Front-End (index)
 * Dikonversi murni dari: ckanext-bmkg\ckanext\bmkg\templates\home\index.html ke JavaScript (.js)
 */

function renderIndex(context = {}) {
  return `{% ckan_extends %}

{% block content %}
<!-- 3. Hero Section with Live Search Filter -->
<section class="hero-banner">
  <div class="hero-content">
    <h1 class="hero-title">
      Satu Pintu Akses Data Meteorologi, Klimatologi, dan Geofisika
    </h1>
    <p class="hero-lead">
      Menyediakan ribuan dataset observasi terpercaya, deret waktu iklim, pemantauan kualitas udara, dan katalog seismik
      Indonesia yang dapat diakses publik, diunduh, dan diintegrasikan melalui API secara bebas tanpa perlu registrasi
      akun.
    </p>

    <!-- Search Box Panel -->
    <div class="search-panel">
      <div class="search-icon-box">
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <input type="text" id="portalSearchInput" class="search-input"
        placeholder="Ketik nama dataset, parameter cuaca, wilayah, atau kode stasiun WMO..."
        oninput="handleLiveSearch(this.value)"
        onkeydown="if(event.key === 'Enter') executeSearch()" />
      <button class="btn-interactive search-submit-btn" onclick="executeSearch()">
        Cari Data
      </button>
    </div>

    <!-- Live Search Feedback Indicator -->
    <div class="search-live-feedback" id="liveSearchFeedback"></div>

    <!-- Interactive Search Shortcuts (Simetris & Sejajar) -->
    <div class="search-shortcuts">
      <span class="shortcut-label">
        <i class="fa-solid fa-arrow-trend-up" style="color: var(--bmkg-blue);"></i>
        Pencarian Populer:
      </span>
      <div class="shortcut-chips-row">
        <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Curah Hujan')">
          <i class="fa-solid fa-cloud-showers-heavy" style="color: #0284c7;"></i> Curah Hujan
        </button>
        <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Gempa')">
          <i class="fa-solid fa-wave-square" style="color: #dc2626;"></i> Gempa M &ge; 5.0
        </button>
        <button class="btn-interactive shortcut-chip" onclick="applySearchTag('PM2.5')">
          <i class="fa-solid fa-wind" style="color: #00875a;"></i> Partikulat PM2.5
        </button>
        <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Suhu')">
          <i class="fa-solid fa-temperature-half" style="color: #ef4444;"></i> Suhu Ekstrem
        </button>
        <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Gelombang')">
          <i class="fa-solid fa-water" style="color: #0284c7;"></i> Gelombang Laut
        </button>
      </div>
    </div>
  </div>
</section>

<!-- 4. Verified Institutional Metrics Bar -->
{% set stats = h.bmkg_get_dataset_stats() %}
<div class="metrics-container">
  <div class="metrics-bar scroll-reveal">
    <div class="metric-item">
      <div class="metric-number">{{ stats.total_datasets }}</div>
      <div class="metric-desc">Dataset Terbuka Terverifikasi</div>
    </div>
    <div class="metric-item">
      <div class="metric-number">4 Pilar</div>
      <div class="metric-desc">Meteorologi, Iklim, Gempa, Kualitas Udara</div>
    </div>
    <div class="metric-item">
      <div class="metric-number">218 UPT</div>
      <div class="metric-desc">Stasiun Observasi di Seluruh Indonesia</div>
    </div>
    <div class="metric-item">
      <div class="metric-number">100% Bebas</div>
      <div class="metric-desc">Lisensi Terbuka CC-BY 4.0 &amp; RESTful API</div>
    </div>
  </div>
</div>



<!-- 5. Main Body Content -->
<main class="main-wrapper">

  <!-- 4 Pillars Section with Interactive Cards -->
  <section id="pilar">
    <div class="section-headline-group scroll-reveal">
      <h2 class="section-title">4 Pilar Layanan Data BMKG</h2>
      <p class="section-subtitle">Struktur taksonomi data terbuka yang dikurasi oleh masing-masing unit teknis
        kedeputian</p>
    </div>

    <div class="pillars-grid">
      <!-- Meteorologi -->
      <a href="/dataset/?groups=meteorologi" class="pillar-box meteorologi scroll-reveal stagger-1" onclick="filterByPilar('meteorologi', event)">
        <div>
          <div class="pillar-header">
            <div class="pillar-icon-badge">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8a5 5 0 0 1 5 5v.5a4.5 4.5 0 1 1 2 8.5H10A6 6 0 0 1 12 8z" fill="rgba(0, 90, 158, 0.15)" />
                <path d="M10 24v3M15 24v3M20 24v3" />
              </svg>
            </div>
            <div class="pillar-name">Meteorologi</div>
          </div>
          <p class="pillar-description">
            Data pengamatan cuaca permukaan, prakiraan gelombang laut maritim, cuaca penerbangan, dan data radar cuaca
            komposit.
          </p>
        </div>
        <div class="pillar-footer">
          <span class="dataset-count-tag">{{ h.bmkg_get_group_dataset_count('meteorologi') }} Dataset</span>
          <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
        </div>
      </a>

      <!-- Klimatologi -->
      <a href="/dataset/?groups=klimatologi" class="pillar-box klimatologi scroll-reveal stagger-2" onclick="filterByPilar('klimatologi', event)">
        <div>
          <div class="pillar-header">
            <div class="pillar-icon-badge">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#047857" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="5" fill="#10b981" stroke="#047857" />
                <line x1="11" y1="2" x2="11" y2="4" />
                <line x1="11" y1="18" x2="11" y2="20" />
                <line x1="2" y1="11" x2="4" y2="11" />
                <line x1="18" y1="11" x2="20" y2="11" />
                <path d="M23 15a2 2 0 0 0-2-2v-5a2 2 0 1 1 4 0v5a2 2 0 0 0-2 2z" fill="#d1fae5" />
                <circle cx="23" cy="22" r="3" fill="#047857" />
                <line x1="23" y1="12" x2="23" y2="22" stroke="#047857" stroke-width="2.5" />
              </svg>
            </div>
            <div class="pillar-name">Klimatologi</div>
          </div>
          <p class="pillar-description">
            Deret waktu iklim historis, pemantauan anomali iklim, data curah hujan dasarian dan bulanan, serta indeks
            kekeringan (SPI).
          </p>
        </div>
        <div class="pillar-footer">
          <span class="dataset-count-tag">{{ h.bmkg_get_group_dataset_count('klimatologi') }} Dataset</span>
          <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
        </div>
      </a>

      <!-- Geofisika -->
      <a href="/dataset/?groups=geofisika" class="pillar-box geofisika scroll-reveal stagger-3" onclick="filterByPilar('geofisika', event)">
        <div>
          <div class="pillar-header">
            <div class="pillar-icon-badge">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#c92a2a" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="16" cy="16" r="13" stroke="#c92a2a" stroke-width="1.8" opacity="0.35"
                  fill="rgba(201, 42, 42, 0.08)" />
                <path d="M4 16h5l2.5-7 4 14 3.5-10 2.5 5 2-2h6.5" stroke="#c92a2a" stroke-width="2.2" />
              </svg>
            </div>
            <div class="pillar-name">Geofisika</div>
          </div>
          <p class="pillar-description">
            Katalog parameter gempa bumi tektonik M &ge; 5.0, pemodelan penjalaran tsunami, kerapatan sambaran petir,
            dan geomagnetisme.
          </p>
        </div>
        <div class="pillar-footer">
          <span class="dataset-count-tag">{{ h.bmkg_get_group_dataset_count('geofisika') }} Dataset</span>
          <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
        </div>
      </a>

      <!-- Kualitas Udara -->
      <a href="/dataset/?groups=kualitas-udara" class="pillar-box kualitas-udara scroll-reveal stagger-4" onclick="filterByPilar('kualitas-udara', event)">
        <div>
          <div class="pillar-header">
            <div class="pillar-icon-badge">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#00875a" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 11h14a3 3 0 1 0-3-3" fill="none" />
                <path d="M3 16h20a3.5 3.5 0 1 1-3.5 3.5" fill="none" />
                <path d="M7 21h10a2.5 2.5 0 1 0-2.5-2.5" fill="none" />
                <circle cx="26" cy="9" r="1.5" fill="#00875a" />
              </svg>
            </div>
            <div class="pillar-name">Kualitas Udara</div>
          </div>
          <p class="pillar-description">
            Konsentrasi partikulat polusi udara PM2.5 dan PM10 dari stasiun GAW/SPKU, kimia air hujan, dan gas rumah
            kaca (GRK).
          </p>
        </div>
        <div class="pillar-footer">
          <span class="dataset-count-tag">{{ h.bmkg_get_group_dataset_count('kualitas-udara') }} Dataset</span>
          <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
        </div>
      </a>
    </div>
  </section>

  <!-- Geospatial Map Section with Region Selector & Layer Filters -->
  <section class="spatial-card" id="peta">
    <div class="spatial-card-header scroll-reveal">
      <div class="spatial-title-group">
        <h3>Peta Sebaran Stasiun Observasi &amp; Aktivitas Seismik</h3>
        <p>Integrasi ckanext-spatial dan ckanext-geoview untuk penelusuran data berbasis wilayah geografis</p>
      </div>
      <div class="spatial-controls-bar">
        <!-- Pilihan Peta Berwarna (Bebas Blokir OSM) -->
        <select class="basemap-select" id="basemapSelector" onchange="changeBasemap(this.value)">
          <option value="street">🗺️ Street Map</option>
          <option value="topo">🏔️ Topografi</option>
          <option value="satellite">🛰️ Citra Satelit</option>
          <option value="natgeo">🧭 NatGeo</option>
        </select>

        <!-- Regional FlyTo Selector -->
        <select class="region-select" id="regionSelector" onchange="flyToRegion(this.value)">
          <option value="indonesia">🌍 Indonesia</option>
          <option value="sumatera">Sumatera (Balai I)</option>
          <option value="jawa">Jawa &amp; Banten (Balai II)</option>
          <option value="balinusra">Bali-Nusra (Balai III)</option>
          <option value="sulawesi">Sulawesi (Balai IV)</option>
          <option value="papua">Papua (Balai V)</option>
        </select>

        <button class="btn-interactive filter-pill-btn active" id="filterStasiun" onclick="toggleMapLayer('stasiun')">
          <i class="fa-solid fa-tower-broadcast"></i> Stasiun UPT
        </button>
        <button class="btn-interactive filter-pill-btn active" id="filterGempaAll"
          onclick="setGempaDisplayFilter('all')">
          <i class="fa-solid fa-circle-nodes"></i> Semua (<span id="countAllGempa">30</span>)
        </button>
        <button class="btn-interactive filter-pill-btn" id="filterGempaM5" onclick="setGempaDisplayFilter('m5')">
          <i class="fa-solid fa-triangle-exclamation"></i> M &ge; 5.0 (<span id="countM5Gempa">15</span>)
        </button>
        <button class="btn-interactive filter-pill-btn" id="filterGempaDirasakan"
          onclick="setGempaDisplayFilter('dirasakan')">
          <i class="fa-solid fa-bullhorn"></i> Dirasakan (<span id="countDirasakanGempa">15</span>)
        </button>
      </div>
    </div>

    <!-- Live BMKG TEWS Alert Bar -->
    <div class="live-tews-alert-bar" id="liveTewsBar"
      style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.96) 100%); border: 1px solid rgba(239, 68, 68, 0.45); border-radius: 8px; padding: 0.65rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);">
      <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
        <span
          style="display: inline-flex; align-items: center; gap: 0.4rem; background: #dc2626; color: #ffffff; font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase;">
          <span
            style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff; animation: tews-ping 1.5s infinite;"></span>
          LIVE BMKG TEWS
        </span>
        <span id="liveTewsHeadline" style="font-size: 0.85rem; font-weight: 700; color: #ffffff;">
          Memuat data seismik terkini dari server BMKG TEWS...
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.78rem;">
        <span id="liveTewsMeta" style="color: #94a3b8; font-family: 'JetBrains Mono', monospace;"></span>
        <button class="btn-interactive" onclick="fetchLiveBMKGGempa(true)" title="Perbarui Data Gempa Detik Ini"
          style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.18); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-rotate"></i> Refresh
        </button>
      </div>
    </div>

    <div class="spatial-map-wrapper">
      <div id="bmkgMap"></div>
      <!-- Collapsible Map Legend Box -->
      <div class="map-legend-box" id="mapLegendBox">
        <div class="legend-heading" onclick="toggleMapLegend()" style="cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-layer-group" style="color: var(--bmkg-blue); font-size: 0.85rem;"></i>
            <span>Legenda Observasi</span>
          </div>
          <button class="btn-interactive legend-toggle-btn" id="legendToggleBtn"
            onclick="event.stopPropagation(); toggleMapLegend()" title="Sembunyikan / Tampilkan Legenda">
            <i class="fa-solid fa-chevron-down" id="legendToggleIcon"></i>
          </button>
        </div>
        <div class="legend-body" id="legendBody">
          <div class="legend-row">
            <div class="legend-point" style="background-color: var(--bmkg-blue);"></div>
            <span>Stasiun Meteorologi / Klimatologi UPT</span>
          </div>
          <div class="legend-row">
            <div class="legend-point" style="background-color: var(--bmkg-green);"></div>
            <span>Stasiun Pemantau Atmosfer Global (GAW)</span>
          </div>
          <div class="legend-row">
            <div
              style="width: 12px; height: 12px; border-radius: 50%; background: #dc2626; border: 2px solid #ffffff; box-shadow: 0 0 0 1.5px #dc2626; flex-shrink: 0;">
            </div>
            <span>Episentrum Gempa Terkini Live (Radar)</span>
          </div>
          <div class="legend-row">
            <div
              style="background: #dc2626; color: #fff; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; flex-shrink: 0;">
              M&ge;5</div>
            <span id="legendGempaM5Text">15 Gempa M &ge; 5.0 Terkini</span>
          </div>
          <div class="legend-row">
            <div
              style="background: #0284c7; color: #fff; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; flex-shrink: 0;">
              MMI</div>
            <span id="legendGempaDirasakanText">15 Gempa Dirasakan Terkini</span>
          </div>
          <div
            style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.4rem;">
            Tip: Arahkan kursor atau klik marker untuk detail gempa &amp; Shakemap
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- DataStore Tabular Preview & Interactive API Explorer -->
  <section class="preview-split-section" id="datastore">
    <div class="preview-tab-controls scroll-reveal">
      <button class="btn-interactive preview-tab-btn active" id="tabBtnTable" onclick="showPreviewTab('table')">
        <i class="fa-solid fa-table-cells"></i> Pratinjau Tabel DataStore
      </button>
      <button class="btn-interactive preview-tab-btn" id="tabBtnApi" onclick="showPreviewTab('api')">
        <i class="fa-solid fa-code"></i> Akses API Terbuka (cURL &amp; Python)
      </button>
    </div>

    <!-- Tab 1: Table with In-Table Filter and Sorting -->
    <div id="panelTable">
      <div class="table-toolbar">
        <div class="table-search-box">
          <i class="fa-solid fa-filter" style="color: var(--text-muted);"></i>
          <input type="text" placeholder="Filter baris tabel (stasiun / suhu)..." oninput="filterTableRows(this.value)">
        </div>

        <div class="table-actions-group">
          <button class="btn-interactive action-sub-btn" onclick="triggerDownloadCSV()">
            <i class="fa-solid fa-file-csv" style="color: var(--bmkg-green);"></i> Unduh CSV
          </button>
          <button class="btn-interactive action-sub-btn" onclick="copyTableJSON()">
            <i class="fa-solid fa-copy"></i> Salin JSON
          </button>
        </div>
      </div>

      <div class="table-responsive-box">
        <table class="gov-table" id="datastoreTable">
          <thead>
            <tr>
              <th onclick="sortTable(0)">tanggal <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(1)">stasiun_id <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(2)">nama_stasiun <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(3)">suhu_min (°C) <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(4)">suhu_max (°C) <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(5)">suhu_rata (°C) <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(6)">kelembapan (%) <i class="fa-solid fa-sort"></i></th>
              <th onclick="sortTable(7)">curah_hujan (mm) <i class="fa-solid fa-sort"></i></th>
            </tr>
          </thead>
          <tbody id="datastoreTableBody">
            <!-- TODO: Isi dengan fetch() API resmi dari instruktur BMKG -->
            <tr id="datastorePlaceholderRow">
              <td colspan="8" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
                <i class="fa-solid fa-satellite-dish" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; color: var(--bmkg-blue);"></i>
                <strong style="display: block; margin-bottom: 0.25rem; color: var(--text-primary);">Menunggu Koneksi API DataStore BMKG</strong>
                <span style="font-size: 0.85rem;">Data observasi akan ditampilkan setelah endpoint API resmi dari BMKG terhubung.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: API Snippet with One-Click Copy -->
    <div id="panelApi" style="display: none;">
      <div class="api-code-panel">
        <div class="code-top-info">
          <span>ENDPOINT PUBLIK: GET https://data.bmkg.go.id/api/3/action/datastore_search</span>
          <button class="btn-interactive copy-btn" id="copyCodeBtn" onclick="copyAPICode()">
            <i class="fa-regular fa-clone"></i> Salin Kode
          </button>
        </div>
        <pre id="apiCodeSnippet"><code># Contoh Akses DataStore API BMKG menggunakan Python
import requests
import pandas as pd

endpoint = "https://data.bmkg.go.id/api/3/action/datastore_search"
params = {
    "resource_id": "cuaca-harian-cengkareng-2026",
    "limit": 100,
    "q": "2026-08"
}

response = requests.get(endpoint, params=params)
payload = response.json()

if payload.get("success"):
    records = payload["result"]["records"]
    df = pd.DataFrame(records)
    print("Berhasil mengambil", len(df), "baris data observasi cuaca:")
    print(df[["tanggal", "suhu_rata", "curah_hujan"]].head())</code></pre>
      </div>
    </div>
  </section>

</main>

<!-- Toast Notification Element -->
<div class="toast-feedback" id="toastFeedback">
  <i class="fa-solid fa-circle-check" style="color: var(--bmkg-green); font-size: 1.1rem;"></i>
  <span id="toastMessage">Tersalin ke papan klip!</span>
</div>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

<!-- Modular Front-end JavaScript Modules BMKG -->
<script src="/js/bmkg-common.js"></script>
<script src="/js/bmkg-map.js"></script>
<script src="/js/bmkg-datastore.js"></script>
<script src="/js/bmkg-landing.js"></script>
<script>
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
  }
  window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
  });

  document.addEventListener('DOMContentLoaded', () => {
    initRealtimeClock();
    initNavbarSoftScroll();
    initScrollReveal();
    initBmkgMap();
    initDatastoreTable();
    initDynamicLandingStats();
  });
</script>
{% endblock %}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = renderIndex;
  module.exports.renderIndex = renderIndex;
  module.exports.default = renderIndex;
}
