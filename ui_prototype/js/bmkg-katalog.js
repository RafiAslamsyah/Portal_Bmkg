/**
 * Portal Open Data BMKG — Catalog Dataset Engine & Facet Search Controller
 * Modules: In-Memory Datasets, Faceted Filtering, Live Search, Dynamic Cards Renderer,
 *          Smart Preview (GeoJSON -> Leaflet Map, CSV -> Table), Dataset Uploader,
 *          Auth Modal Handlers, Facet Counters, Real-time Clock.
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
    datastoreActive: true,
    csvContent: `Tanggal,Suhu_Min_C,Suhu_Max_C,Suhu_Rata_C,Kelembapan_Persen,Curah_Hujan_mm,Kecepatan_Angin_knot
2026-08-01,24.2,32.8,28.1,78,0.0,8
2026-08-02,23.9,33.1,28.4,76,0.0,10
2026-08-03,24.5,31.5,27.8,82,12.4,12
2026-08-04,24.0,32.0,28.0,80,2.5,9
2026-08-05,24.1,33.4,28.6,75,0.0,7
2026-08-06,23.8,32.9,28.2,77,0.0,8
2026-08-07,24.4,31.8,27.9,84,18.0,14`
  },
  {
    id: 'gempa-bumi-m5-indonesia',
    pilar: 'geofisika',
    formats: ['geojson'],
    org: 'pusat',
    time: 'realtime',
    title: 'Katalog Sebaran Spasial Gempa Bumi Tektonik M ≥ 5.0 Wilayah Indonesia (GeoJSON)',
    description: 'Dataset geospasial sebaran episenter gempabumi tektonik dengan magnitudo M>=5.0 di seluruh wilayah Kepulauan Indonesia lengkap dengan koordinat spasial, kedalaman hiposenter, magnitudo terkalibrasi, dan waktu kejadian resmi dari Pusat Gempabumi dan Tsunami BMKG.',
    producer: 'Pusat Gempabumi dan Tsunami (BMKG Pusat)',
    temporalRange: '01 Jan 2026 – 31 Des 2026',
    datastoreActive: false,
    geojsonUrl: 'data/gempa_tektonik_m5_indonesia.geojson'
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
  let list = [];
  if (!raw) {
    list = [...SEED_DATASETS];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  }
  try {
    list = JSON.parse(raw);
    if (!Array.isArray(list)) list = [...SEED_DATASETS];
  } catch (_) {
    list = [...SEED_DATASETS];
  }

  // Pastikan dataset seed GeoJSON selalu ada jika belum tersimpan
  SEED_DATASETS.forEach(seed => {
    if (!list.some(d => d.id === seed.id)) {
      list.push(seed);
    }
  });

  return list;
}

function saveDatasets(datasets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

// ==========================================================================
// 3. DATASET CARDS RENDERER
// ==========================================================================
function renderDatasetCards() {
  const container = document.getElementById('datasetListContainer');
  if (!container) return;
  const datasets = getDatasets();
  container.innerHTML = '';

  if (datasets.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);">
      <i class="fa-solid fa-folder-open" style="font-size:2.5rem;margin-bottom:1rem;display:block;color:var(--border-medium);"></i>
      <p style="font-size:1.05rem;font-weight:600;">Belum ada dataset tersedia</p>
      <p style="font-size:0.85rem;">Dataset akan muncul setelah Anda mengunggah berkas atau menginput data.</p></div>`;
    const resEl = document.getElementById('datasetResultCount');
    const totEl = document.getElementById('datasetTotalCount');
    if (resEl) resEl.textContent = '0';
    if (totEl) totEl.textContent = '0';
    return;
  }

  datasets.forEach(ds => {
    const pilarInfo = PILAR_CONFIG[ds.pilar] || { cls: 'met', icon: 'fa-database', label: ds.pilar };
    const formats = ds.formats || [];
    const isGeoJSON = formats.map(f => f.toLowerCase()).includes('geojson');

    const formatBadges = formats.map(f =>
      `<span class="format-badge ${escapeHtml(f.toLowerCase())}">${escapeHtml(f.toUpperCase())}</span>`).join('');

    const datastoreBadge = ds.datastoreActive
      ? `<span style="font-size:0.76rem;color:var(--bmkg-green-dark);font-weight:700;background:var(--bmkg-green-light);padding:2px 8px;border-radius:4px;">
           <i class="fa-solid fa-database"></i> DataStore API Aktif</span>` : '';

    const previewBtnClass = isGeoJSON ? 'btn-interactive card-sub-btn preview-geo-btn' : 'btn-interactive card-sub-btn';
    const previewBtnStyle = isGeoJSON ? 'style="background: linear-gradient(135deg, #003865, #005a9e); color: #ffffff; border-color: #003865; font-weight: 700;"' : '';
    const previewBtnIcon  = isGeoJSON ? 'fa-map-location-dot' : 'fa-table-cells';
    const previewBtnLabel = isGeoJSON ? 'Peta' : 'Pratinjau';
    const previewBtnTitle = isGeoJSON ? 'Lihat visualisasi peta spasial interaktif GeoJSON' : 'Pratinjau tabel DataStore';

    container.innerHTML += `
      <article class="dataset-card" data-pilar="${escapeHtml(ds.pilar)}" data-format="${escapeHtml(formats.join(' '))}" data-org="${escapeHtml(ds.org || '')}" data-time="${escapeHtml(ds.time || '')}" data-id="${escapeHtml(ds.id)}">
        <div class="card-top-meta">
          <span class="pillar-tag ${pilarInfo.cls}"><i class="fa-solid ${pilarInfo.icon}"></i> ${escapeHtml(pilarInfo.label)}</span>
          <span class="org-producer-text"><i class="fa-solid fa-building"></i> ${escapeHtml(ds.producer || '-')}</span>
        </div>
        <a href="#" class="dataset-card-title" onclick="openDatasetDetail('${escapeHtml(ds.id)}'); return false;">${escapeHtml(ds.title)}</a>
        <p class="dataset-card-description">${escapeHtml(ds.description)}</p>
        <div class="card-bottom-row">
          <div class="format-pills-group">${formatBadges}${datastoreBadge}</div>
          <div class="temporal-range-tag"><i class="fa-regular fa-calendar"></i> ${escapeHtml(ds.temporalRange || '-')}</div>
          <div class="card-action-links">
            <button class="${previewBtnClass}" ${previewBtnStyle} title="${previewBtnTitle}" onclick="openPreviewModal('${escapeHtml(ds.id)}')">
              <i class="fa-solid ${previewBtnIcon}" style="${isGeoJSON ? 'color: #38bdf8;' : ''}"></i> ${previewBtnLabel}
            </button>
            <button class="btn-interactive card-sub-btn" onclick="triggerDatasetDownload('${escapeHtml(ds.id)}')">
              <i class="fa-solid fa-download"></i> Unduh
            </button>
          </div>
        </div>
      </article>`;
  });

  const totEl = document.getElementById('datasetTotalCount');
  const resEl = document.getElementById('datasetResultCount');
  if (totEl) totEl.textContent = datasets.length;
  if (resEl) resEl.textContent = datasets.length;
}

// ==========================================================================
// 4. SMART PREVIEW MODAL (GeoJSON -> Leaflet Map | CSV -> Table)
// ==========================================================================
window._previewState = {
  leafletMap: null,
  datasetId: null,
  geoLayer: null
};

function openPreviewModal(datasetId) {
  const datasets = getDatasets();
  const ds = datasets.find(d => d.id === datasetId);
  if (!ds) return;

  const modal      = document.getElementById('previewModal');
  const body       = document.getElementById('previewModalBody');
  const titleEl    = document.getElementById('previewModalTitle');
  const subtitleEl = document.getElementById('previewModalSubtitle');
  const iconEl     = document.getElementById('previewModalIcon');
  const footerTxt  = document.getElementById('previewFooterText');
  if (!modal || !body) return;

  window._previewState.datasetId = datasetId;
  if (window._previewState.leafletMap) {
    try { window._previewState.leafletMap.remove(); } catch(_) {}
    window._previewState.leafletMap = null;
  }

  if (titleEl) titleEl.textContent = ds.title || 'Pratinjau Dataset';

  const formats   = (ds.formats || []).map(f => f.toLowerCase());
  const isGeoJSON = formats.includes('geojson');

  if (isGeoJSON) {
    if (iconEl) { iconEl.className = 'preview-modal-header-icon geojson'; iconEl.innerHTML = '<i class="fa-solid fa-map-location-dot"></i>'; }
    if (subtitleEl) subtitleEl.textContent = 'Pratinjau Peta Spasial Interaktif GeoJSON — Leaflet Map Engine';
    if (footerTxt)  footerTxt.textContent  = 'Klik marker / geometri di peta untuk memeriksa atribut lengkap';

    body.innerHTML = `
      <div class="preview-map-infobar" style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px;">
        <span class="map-infobar-badge" style="display:inline-flex;align-items:center;gap:5px;font-weight:700;color:#003865;">
          <i class="fa-solid fa-earth-asia" style="color:#005a9e;"></i> Spasial GeoJSON (WGS 84)
        </span>
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="btn-interactive" onclick="resetPreviewMapZoom()" style="padding:3px 8px;font-size:11.5px;border-radius:4px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;">
            <i class="fa-solid fa-expand"></i> Pusatkan
          </button>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;padding:2px 8px;border-radius:4px;" id="previewFeatureCount">
            <i class="fa-solid fa-spinner fa-spin"></i> Memuat fitur...
          </span>
        </div>
      </div>
      <div id="previewGeojsonMap" style="width:100%;height:480px;background:#e2e8f0;position:relative;"></div>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { _initGeojsonMap(ds); }, 120);

  } else {
    if (iconEl) { iconEl.className = 'preview-modal-header-icon csv'; iconEl.innerHTML = '<i class="fa-solid fa-table-cells"></i>'; }
    if (subtitleEl) subtitleEl.textContent = 'Pratinjau Tabel Observasi CSV';
    if (footerTxt)  footerTxt.textContent  = 'Menampilkan baris data observasi BMKG';

    body.innerHTML = _buildCsvTableHtml(ds);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function _initGeojsonMap(ds) {
  const mapEl = document.getElementById('previewGeojsonMap');
  const featureCountEl = document.getElementById('previewFeatureCount');
  if (!mapEl) return;

  const leafMap = L.map('previewGeojsonMap', { center: [-2.5, 118.0], zoom: 5, zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO | Data: BMKG', maxZoom: 19
  }).addTo(leafMap);
  window._previewState.leafletMap = leafMap;

  // 1. Cek inline content
  if (ds.geojsonContent) {
    let raw = ds.geojsonContent;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch(e) {
        _showMapEmpty(mapEl, featureCountEl, 'Konten GeoJSON tidak valid (gagal parse JSON).');
        return;
      }
    }
    _renderGeojsonLayer(leafMap, raw, featureCountEl);
  } else if (ds.geojsonUrl || ds.fileUrl || ds.url) {
    const targetUrl = ds.geojsonUrl || ds.fileUrl || ds.url;
    _fetchAndRenderGeojson(leafMap, targetUrl, featureCountEl);
  } else {
    _fetchAndRenderGeojson(leafMap, 'data/gempa_tektonik_m5_indonesia.geojson', featureCountEl);
  }
}

function resetPreviewMapZoom() {
  if (window._previewState && window._previewState.leafletMap && window._previewState.geoLayer) {
    const b = window._previewState.geoLayer.getBounds();
    if (b.isValid()) window._previewState.leafletMap.fitBounds(b, { padding: [30, 30], maxZoom: 12 });
  }
}

function _normalizeToFeatureCollection(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch(e) { return null; }
  }
  if (raw.type === 'FeatureCollection' && Array.isArray(raw.features)) return raw;
  if (raw.type === 'Feature') return { type:'FeatureCollection', features:[raw] };
  const GEOM = ['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon','GeometryCollection'];
  if (GEOM.includes(raw.type)) return { type:'FeatureCollection', features:[{type:'Feature',geometry:raw,properties:{}}] };

  // Format BMKG InaTEWS: { info: [ { point: { coordinates: "lon,lat" }, ... } ] }
  if (Array.isArray(raw.info)) {
    const features = [];
    raw.info.forEach(item => {
      const cs = item.point && item.point.coordinates ? item.point.coordinates : null;
      if (!cs) return;
      const parts = cs.split(',').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        features.push({
          type: 'Feature',
          geometry: { type:'Point', coordinates:[parts[0], parts[1]] },
          properties: Object.assign({}, item)
        });
      }
    });
    return { type:'FeatureCollection', features };
  }

  // Array flat dengan lat/lon
  if (Array.isArray(raw)) {
    const features = [];
    raw.forEach(item => {
      const lat = parseFloat(item.lat || item.latitude || item.Lintang || item.y);
      const lon = parseFloat(item.lon || item.lng || item.longitude || item.Bujur || item.x);
      if (!isNaN(lat) && !isNaN(lon)) {
        features.push({ type:'Feature', geometry:{type:'Point',coordinates:[lon,lat]}, properties:Object.assign({},item) });
      }
    });
    return { type:'FeatureCollection', features };
  }

  return null;
}

function _renderGeojsonLayer(leafMap, raw, featureCountEl) {
  const geojson = _normalizeToFeatureCollection(raw);
  const mapEl = document.getElementById('previewGeojsonMap');

  if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
    _showMapEmpty(mapEl, featureCountEl, 'Data GeoJSON tidak memuat fitur spasial koordinat.');
    return;
  }

  if (featureCountEl) featureCountEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${geojson.features.length} Fitur Spasial`;

  function getStyle(feature) {
    const props = feature.properties || {};
    const mag = parseFloat(props.mag || props.magnitude || props.Magnitudo || 0);

    let fillColor = '#0070ba';
    if (mag >= 6.0) fillColor = '#dc2626';
    else if (mag >= 5.0) fillColor = '#ea580c';
    else if (mag >= 4.0) fillColor = '#f59e0b';

    const radius = mag > 0 ? Math.max(6, Math.min(16, (mag - 2) * 2.8)) : 7;
    return { color:'#ffffff', fillColor: fillColor, fillOpacity:0.85, weight:2, radius: radius };
  }

  function buildPopup(feature) {
    const props = feature.properties || {};
    const rows = Object.entries(props)
      .filter(([,v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .slice(0, 14)
      .map(([k,v]) => `<tr>
        <td style="padding:3px 8px;font-weight:700;color:#003865;white-space:nowrap;font-size:11px;">${escapeHtml(String(k))}</td>
        <td style="padding:3px 8px;color:#334155;font-size:11.5px;word-break:break-word;">${escapeHtml(String(v))}</td></tr>`).join('');
    return `<div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:280px;">
      <div style="background:linear-gradient(135deg,#003865,#005a9e);color:#fff;padding:7px 10px;margin:-8px -8px 6px;border-radius:6px 6px 0 0;font-weight:800;font-size:12.5px;">
        <i class="fa-solid fa-map-pin" style="margin-right:5px;"></i>Atribut Fitur BMKG</div>
      <table style="width:100%;border-collapse:collapse;">
        ${rows||'<tr><td colspan="2" style="padding:6px;color:#64748b;font-size:11px;">Tidak ada properti</td></tr>'}
      </table></div>`;
  }

  try {
    const layer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, getStyle(feature)),
      style: getStyle,
      onEachFeature: (feature, lyr) => {
        if (feature.properties && Object.keys(feature.properties).length > 0) {
          lyr.bindPopup(buildPopup(feature), { maxWidth:320 });
        }
      }
    }).addTo(leafMap);

    window._previewState.geoLayer = layer;
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      leafMap.fitBounds(bounds, { padding:[35,35], maxZoom:12 });
    }

    setTimeout(() => {
      leafMap.invalidateSize();
      if (bounds.isValid()) leafMap.fitBounds(bounds, { padding:[35,35], maxZoom:12 });
    }, 200);

  } catch(err) {
    console.warn('[BMKG Preview] GeoJSON render error:', err);
    _showMapEmpty(mapEl, featureCountEl, `GeoJSON tidak dapat dirender: ${err.message}`);
  }
}

async function _fetchAndRenderGeojson(leafMap, url, featureCountEl) {
  if (featureCountEl) featureCountEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengambil GeoJSON...';
  try {
    const res = await fetch(url, { cache:'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _renderGeojsonLayer(leafMap, data, featureCountEl);
  } catch(err) {
    console.warn('[BMKG Preview] Fetch error:', err);
    _showMapEmpty(document.getElementById('previewGeojsonMap'), featureCountEl, `Gagal memuat GeoJSON dari server (${err.message}).`);
  }
}

function _showMapEmpty(mapEl, featureCountEl, msg) {
  if (featureCountEl) featureCountEl.textContent = '0 fitur';
  if (!mapEl) return;
  const overlay = document.createElement('div');
  overlay.className = 'preview-map-empty';
  overlay.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.92);padding:2rem;text-align:center;z-index:100;';
  overlay.innerHTML = `
    <i class="fa-solid fa-map-location-dot" style="font-size:2.5rem;color:var(--border-medium);margin-bottom:0.5rem;"></i>
    <strong style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:0.35rem;">Data peta tidak tersedia</strong>
    <p style="font-size:0.82rem;max-width:360px;line-height:1.55;color:var(--text-muted);">${
      msg || 'Dataset belum memiliki konten GeoJSON. Upload ulang berkas GeoJSON melalui tombol Unggah Dataset.'
    }</p>`;
  mapEl.appendChild(overlay);
}

function _buildCsvTableHtml(ds) {
  const csvRaw = ds.csvContent || null;
  if (!csvRaw) return `<div class="preview-table-wrapper" style="padding:3rem;text-align:center;color:var(--text-muted);">
    <i class="fa-solid fa-table-cells" style="font-size:2.5rem;display:block;margin-bottom:0.75rem;color:var(--border-medium);"></i>
    <strong style="display:block;margin-bottom:0.35rem;color:var(--text-secondary);">Pratinjau tabel belum tersedia</strong>
    <p style="font-size:0.82rem;line-height:1.5;max-width:380px;margin:0 auto;">
      Dataset ini belum memiliki konten CSV tersimpan.</p></div>`;

  const lines = csvRaw.trim().split(/\r?\n/);
  if (lines.length < 2) return `<div class="preview-table-wrapper" style="padding:2rem;text-align:center;color:var(--text-muted);">CSV tidak memiliki baris data.</div>`;

  const delim   = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delim).map(h => h.replace(/^"|"$/g,'').trim());
  const rows    = lines.slice(1,51);
  const headerHtml = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const rowsHtml   = rows.map(line => `<tr>${line.split(delim).map(c => `<td>${escapeHtml(c.replace(/^"|"$/g,'').trim())}</td>`).join('')}</tr>`).join('');
  return `<div class="preview-table-wrapper"><table class="preview-table"><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}

function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  if (window._previewState && window._previewState.leafletMap) {
    try { window._previewState.leafletMap.remove(); } catch(_) {}
    window._previewState.leafletMap = null;
  }
  setTimeout(() => {
    const body = document.getElementById('previewModalBody');
    if (body) body.innerHTML = `<div class="preview-map-loading" id="previewModalLoading">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--bmkg-blue);"></i>
      <span>Memuat pratinjau dataset...</span></div>`;
  }, 280);
}

function handlePreviewModalBackdrop(event) {
  if (event.target && event.target.id === 'previewModal') closePreviewModal();
}

function triggerPreviewDownload() {
  const id = window._previewState && window._previewState.datasetId;
  if (id) triggerDatasetDownload(id);
}

function triggerDatasetDownload(datasetId) {
  const ds = getDatasets().find(d => d.id === datasetId);
  if (!ds) {
    showToast('Dataset tidak ditemukan');
    return;
  }
  showToast(`Mengunduh berkas ${ds.title}...`);
  if (ds.geojsonContent) {
    const blob = new Blob([typeof ds.geojsonContent === 'string' ? ds.geojsonContent : JSON.stringify(ds.geojsonContent, null, 2)], { type: 'application/geo+json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ds.id}.geojson`;
    a.click();
  } else if (ds.csvContent) {
    const blob = new Blob([ds.csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ds.id}.csv`;
    a.click();
  } else if (ds.geojsonUrl) {
    window.open(ds.geojsonUrl, '_blank');
  }
}

// ==========================================================================
// 5. UPLOAD DATASET MODAL CONTROLLER (GeoJSON & CSV)
// ==========================================================================
let _uploadedFileContent = null;
let _uploadedFormat = 'geojson';
let _uploadedFileName = '';

function openUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  _uploadedFileContent = null;
  _uploadedFormat = 'geojson';
  _uploadedFileName = '';
  const form = document.getElementById('uploadDatasetForm');
  if (form) form.reset();
  const badge = document.getElementById('uploadFileInfoBadge');
  if (badge) badge.style.display = 'none';
  const dropText = document.getElementById('uploadDropText');
  if (dropText) dropText.textContent = 'Klik untuk pilih berkas atau seret berkas ke sini';
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleUploadBackdropClick(e) {
  if (e.target && e.target.id === 'uploadModal') closeUploadModal();
}

function handleFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  _uploadedFileName = file.name;
  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  reader.onload = function(e) {
    const content = e.target.result;
    _uploadedFileContent = content;

    const badge = document.getElementById('uploadFileInfoBadge');
    const dropText = document.getElementById('uploadDropText');
    if (dropText) dropText.textContent = file.name + ` (${(file.size / 1024).toFixed(1)} KB)`;

    if (ext === 'geojson' || ext === 'json') {
      try {
        const json = JSON.parse(content);
        const norm = _normalizeToFeatureCollection(json);
        const count = norm && norm.features ? norm.features.length : 0;
        _uploadedFormat = 'geojson';
        if (badge) {
          badge.style.display = 'block';
          badge.style.background = '#ecfdf5';
          badge.style.color = '#047857';
          badge.style.border = '1px solid #a7f3d0';
          badge.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> Format: <strong>GeoJSON Terverifikasi</strong> (${count} fitur spasial terdeteksi) &mdash; Tombol [Peta] akan aktif!`;
        }
        if (content.includes('gempa') || content.includes('magnitude') || content.includes('InaTEWS')) {
          const pilarSel = document.getElementById('uploadPilar');
          if (pilarSel) pilarSel.value = 'geofisika';
        }
      } catch (err) {
        _uploadedFormat = 'geojson';
        if (badge) {
          badge.style.display = 'block';
          badge.style.background = '#fef2f2';
          badge.style.color = '#b91c1c';
          badge.style.border = '1px solid #fecaca';
          badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Berkas JSON memiliki kesalahan sintaks: ${err.message}`;
        }
      }
    } else if (ext === 'csv') {
      _uploadedFormat = 'csv';
      const lines = content.trim().split(/\r?\n/).length;
      if (badge) {
        badge.style.display = 'block';
        badge.style.background = '#eff6ff';
        badge.style.color = '#1d4ed8';
        badge.style.border = '1px solid #bfdbfe';
        badge.innerHTML = `<i class="fa-solid fa-table-cells"></i> Format: <strong>CSV Terdeteksi</strong> (${lines} baris data) &mdash; Pratinjau Tabel akan aktif!`;
      }
    }
  };

  reader.readAsText(file);
}

function handleUploadDatasetSubmit(event) {
  event.preventDefault();
  const title = document.getElementById('uploadTitle').value.trim();
  const pilar = document.getElementById('uploadPilar').value;
  const org = document.getElementById('uploadOrg').value;
  const desc = document.getElementById('uploadDesc').value.trim() || 'Dataset resmi observasi Badan Meteorologi, Klimatologi, dan Geofisika.';

  if (!_uploadedFileContent) {
    alert('Silakan pilih berkas GeoJSON atau CSV terlebih dahulu.');
    return;
  }

  const id = 'dataset-' + Date.now();
  const orgLabels = {
    'pusat': 'Pusat Gempabumi dan Tsunami (BMKG Pusat)',
    'balai1': 'BBMKG Wilayah I (Medan)',
    'balai2': 'BBMKG Wilayah II (Ciputat)',
    'balai3': 'BBMKG Wilayah III (Denpasar)',
    'balai4': 'BBMKG Wilayah IV (Makassar)',
    'balai5': 'BBMKG Wilayah V (Jayapura)'
  };

  const newDs = {
    id: id,
    title: title,
    pilar: pilar,
    org: org,
    formats: [_uploadedFormat],
    producer: orgLabels[org] || 'BMKG',
    description: desc,
    temporalRange: new Date().getFullYear().toString(),
    datastoreActive: _uploadedFormat === 'csv'
  };

  if (_uploadedFormat === 'geojson') {
    newDs.geojsonContent = _uploadedFileContent;
  } else {
    newDs.csvContent = _uploadedFileContent;
  }

  const datasets = getDatasets();
  datasets.unshift(newDs);
  saveDatasets(datasets);

  closeUploadModal();
  renderDatasetCards();
  updateFacetCounts();
  applyFilterAndSearch();

  showToast(`Dataset "${title}" berhasil diunggah! Klik tombol "${_uploadedFormat === 'geojson' ? 'Peta' : 'Pratinjau'}" untuk melihat visualisasinya.`);
}

// ==========================================================================
// 6. FACET COUNTS & LIVE FILTER / SEARCH
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
      </span>`;
  }

  pilars.forEach(p => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Pilar: ${p.toUpperCase()}</span>
        <button onclick="uncheckFacet('facet-pilar', '${p}')"><i class="fa-solid fa-xmark"></i></button>
      </span>`;
  });

  formats.forEach(f => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Format: ${f.toUpperCase()}</span>
        <button onclick="uncheckFacet('facet-format', '${f}')"><i class="fa-solid fa-xmark"></i></button>
      </span>`;
  });

  orgs.forEach(o => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Unit: ${o.toUpperCase()}</span>
        <button onclick="uncheckFacet('facet-org', '${o}')"><i class="fa-solid fa-xmark"></i></button>
      </span>`;
  });

  times.forEach(t => {
    container.innerHTML += `
      <span class="chip-badge">
        <span>Waktu: ${t.toUpperCase()}</span>
        <button onclick="uncheckFacet('facet-time', '${t}')"><i class="fa-solid fa-xmark"></i></button>
      </span>`;
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
  const s = document.getElementById('catalogSearchInput');
  if (s) s.value = '';
  document.querySelectorAll('.facet-pilar, .facet-format, .facet-org, .facet-time').forEach(cb => cb.checked = false);
  applyFilterAndSearch();
  showToast('Seluruh filter telah di-reset');
}

function applySorting(sortVal) {
  showToast(`Mengurutkan dataset berdasarkan: ${sortVal}`);
}

function toggleSpatialFilter() {
  showToast('Fitur seleksi Bounding Box (Peta Spasial) aktif');
}

function openDatasetDetail(datasetId) {
  showToast(`Membuka halaman detail dataset: ${datasetId}`);
}

// ==========================================================================
// 7. LOGIN & REGISTRATION MODAL HANDLERS
// ==========================================================================
function openLoginModal(defaultTab = 'login') {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  switchAuthMode(defaultTab);
  setTimeout(() => {
    if (defaultTab === 'register') {
      const regInput = document.getElementById('regName');
      if (regInput) regInput.focus();
    } else {
      const idInput = document.getElementById('loginIdentifier');
      if (idInput) idInput.focus();
    }
  }, 100);
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleModalBackdropClick(e) {
  if (e.target && e.target.id === 'loginModal') {
    closeLoginModal();
  }
}

function switchAuthMode(mode) {
  const tabLogin = document.getElementById('mainTabLogin');
  const tabRegister = document.getElementById('mainTabRegister');
  const formLogin = document.getElementById('authFormLogin');
  const formRegister = document.getElementById('authFormRegister');
  const title = document.getElementById('modalHeaderTitle');
  const subtitle = document.getElementById('modalHeaderSubtitle');

  if (mode === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
    if (title) title.textContent = 'Portal Data BMKG';
    if (subtitle) subtitle.textContent = 'Akses SSO Resmi & Akun Terbuka Publik';
  } else {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'block';
    if (title) title.textContent = 'Registrasi Akun Baru';
    if (subtitle) subtitle.textContent = 'Dapatkan Akses API Terbuka & Notifikasi Data';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
  } else {
    input.type = 'password';
    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
  }
}

function checkPasswordStrength(val) {
  const meter = document.getElementById('passStrengthMeter');
  const text = document.getElementById('passStrengthText');
  if (!meter || !text) return;

  if (!val) {
    meter.style.width = '0%';
    meter.style.background = '#cbd5e1';
    text.textContent = 'Kekuatan: -';
    text.style.color = 'var(--text-muted)';
    return;
  }

  let strength = 0;
  if (val.length >= 8) strength += 25;
  if (/[A-Z]/.test(val)) strength += 25;
  if (/[0-9]/.test(val)) strength += 25;
  if (/[^A-Za-z0-9]/.test(val)) strength += 25;

  meter.style.width = strength + '%';
  if (strength <= 25) {
    meter.style.background = '#ef4444';
    text.textContent = 'Kekuatan: Lemah';
    text.style.color = '#ef4444';
  } else if (strength <= 75) {
    meter.style.background = '#f59e0b';
    text.textContent = 'Kekuatan: Sedang';
    text.style.color = '#f59e0b';
  } else {
    meter.style.background = '#10b981';
    text.textContent = 'Kekuatan: Kuat (Aman)';
    text.style.color = '#10b981';
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const idVal = document.getElementById('loginIdentifier').value.trim();
  closeLoginModal();
  showToast(`Login Berhasil! Selamat datang kembali, ${idVal}.`);
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  closeLoginModal();
  showToast(`Registrasi Berhasil! Selamat datang, ${name}.`);
}

// ==========================================================================
// 8. REALTIME CLOCK & UTILS
// ==========================================================================
function initRealtimeClock() {
  const timeElem = document.getElementById('liveClockTime');
  const dateElem = document.getElementById('liveClockDate');
  if (!timeElem || !dateElem) return;

  function updateClock() {
    const now = new Date();
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    dateElem.textContent = now.toLocaleDateString('id-ID', dateOptions);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    let tz = 'WIB';
    const offset = -now.getTimezoneOffset() / 60;
    if (offset === 8) tz = 'WITA';
    else if (offset === 9) tz = 'WIT';
    else if (offset !== 7) tz = `UTC${offset >= 0 ? '+' : ''}${offset}`;

    timeElem.textContent = `${hours}:${minutes}:${seconds} ${tz}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

function showToast(msg) {
  const toast = document.getElementById('toastFeedback');
  if (!toast) return;
  const msgEl = document.getElementById('toastMessage');
  if (msgEl) msgEl.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

// Global Storage listener
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    renderDatasetCards();
    updateFacetCounts();
    applyFilterAndSearch();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePreviewModal();
    closeLoginModal();
    closeUploadModal();
  }
});

function initKatalogPage() {
  renderDatasetCards();
  updateFacetCounts();
  initRealtimeClock();
  initUrlParams();
}

// Auto init on DOM ready
document.addEventListener('DOMContentLoaded', initKatalogPage);
