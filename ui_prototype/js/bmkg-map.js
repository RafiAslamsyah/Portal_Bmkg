/**
 * Portal Open Data BMKG — Geospatial Map & Live TEWS Engine
 * Modules: Leaflet Map Setup, Basemap Selector, Regional FlyTo, UPT Station Markers, Live TEWS Multi-Feed
 */

// Global map references
let bmkgMap = null;
let stasiunLayer = null;
let gempaLayer = null;
let activeBasemap = null;
let basemapLayers = {};

window._allGempaItems = [];
window._activeGempaFilter = 'all';

// Fallback dataset jika API offline
const fallbackGempaList = [
  { wilayah: "Pusat gempa berada di laut 118 km BaratLaut Jailolo", mag: 5.1, kedalaman: "24 km", lat: 1.35, lon: 126.44, tanggal: "17 Sep 2026 13:20:53 WIB", jam: "13:20:53 WIB", status: "Tidak berpotensi tsunami", dirasakan: "III-IV Batang Dua, III Manado, III Ternate", shakemap: "https://data.bmkg.go.id/DataMKG/TEWS/20260917132053.mmi.jpg", isLatestLive: true, kategori: "autogempa" },
  { wilayah: "42 km TimurLaut PULAUDOI-MALUT", mag: 6.2, kedalaman: "145 km", lat: 2.52, lon: 128.09, tanggal: "14 Sep 2026 17:58:04 WIB", jam: "17:58 WIB", status: "Tidak berpotensi tsunami", dirasakan: "III-IV Morotai, III Halmahera Utara", shakemap: null, isLatestLive: false, kategori: "m5" },
  { wilayah: "186 km BaratDaya BAYAH-BANTEN", mag: 5.6, kedalaman: "10 km", lat: -8.54, lon: 105.78, tanggal: "14 Sep 2026 16:27:39 WIB", jam: "16:27 WIB", status: "Tidak berpotensi tsunami", dirasakan: "", shakemap: null, isLatestLive: false, kategori: "m5" },
  { wilayah: "156 km Tenggara KAB-MALANG-JATIM", mag: 5.2, kedalaman: "10 km", lat: -9.52, lon: 112.85, tanggal: "14 Sep 2026 08:42:08 WIB", jam: "08:42 WIB", status: "Tidak berpotensi tsunami", dirasakan: "II-III Pacitan, II-III Malang", shakemap: null, isLatestLive: false, kategori: "m5" },
  { wilayah: "6 km Tenggara KEPSERIBU-DKI", mag: 5.9, kedalaman: "376 km", lat: -5.81, lon: 106.56, tanggal: "12 Sep 2026 04:23:56 WIB", jam: "04:23 WIB", status: "Pusat gempa dalam", dirasakan: "", shakemap: null, isLatestLive: false, kategori: "m5" },
  { wilayah: "Pusat gempa di darat 27 km selatan Kab. Bandung", mag: 2.7, kedalaman: "4 km", lat: -7.25, lon: 107.61, tanggal: "17 Sep 2026 06:21:05 WIB", jam: "06:21 WIB", status: "Gempa dangkal sesar lokal", dirasakan: "III Pangalengan, III Talegong, III Cisewu", shakemap: null, isLatestLive: false, kategori: "dirasakan" },
  { wilayah: "Pusat gempa di darat 23 km selatan Kab. Bandung", mag: 2.6, kedalaman: "3 km", lat: -7.22, lon: 107.60, tanggal: "17 Sep 2026 04:59:20 WIB", jam: "04:59 WIB", status: "Gempa dangkal", dirasakan: "III Pangalengan, III Kertasari", shakemap: null, isLatestLive: false, kategori: "dirasakan" },
  { wilayah: "Pusat gempa di laut 48 km Utara Ruteng-Manggarai", mag: 4.7, kedalaman: "6 km", lat: -8.19, lon: 120.35, tanggal: "16 Sep 2026 01:26:34 WIB", jam: "01:26 WIB", status: "Tidak berpotensi tsunami", dirasakan: "III-IV Kab. Manggarai", shakemap: null, isLatestLive: false, kategori: "dirasakan" },
  { wilayah: "Pusat gempa di laut 83 km selatan Kab. Sukabumi", mag: 4.3, kedalaman: "23 km", lat: -7.74, lon: 106.55, tanggal: "13 Sep 2026 17:06:52 WIB", jam: "17:06 WIB", status: "Tidak berpotensi tsunami", dirasakan: "III Kab. Cianjur, II Sukabumi", shakemap: null, isLatestLive: false, kategori: "dirasakan" }
];

// Titik Stasiun BMKG Nyata
const stasiunList = [
  { nama: "Stamet Soekarno-Hatta", id: "96749", lat: -6.1256, lon: 106.6559, tipe: "Meteorologi", suhu: "28.5°C", angin: "14 knot", color: "#005a9e" },
  { nama: "Stamet Kemayoran", id: "96745", lat: -6.1558, lon: 106.8417, tipe: "Meteorologi / GAW", suhu: "29.1°C", angin: "11 knot", color: "#00875a" },
  { nama: "Staklim Banten", id: "96739", lat: -6.1833, lon: 106.2500, tipe: "Klimatologi", suhu: "27.8°C", angin: "8 knot", color: "#005a9e" },
  { nama: "Stageof Tangerang", id: "96753", lat: -6.1783, lon: 106.6319, tipe: "Geofisika", suhu: "28.0°C", angin: "9 knot", color: "#005a9e" },
  { nama: "BBMKG Wilayah I Medan", id: "96035", lat: 3.5852, lon: 98.6756, tipe: "Balai Wilayah I", suhu: "29.4°C", angin: "10 knot", color: "#003865" },
  { nama: "BBMKG Wilayah III Denpasar", id: "97230", lat: -8.6705, lon: 115.2126, tipe: "Balai Wilayah III", suhu: "30.2°C", angin: "15 knot", color: "#003865" },
  { nama: "BBMKG Wilayah IV Makassar", id: "97180", lat: -5.1477, lon: 119.4327, tipe: "Balai Wilayah IV", suhu: "31.0°C", angin: "12 knot", color: "#003865" },
  { nama: "BBMKG Wilayah V Jayapura", id: "97560", lat: -2.5337, lon: 140.7181, tipe: "Balai Wilayah V", suhu: "28.8°C", angin: "7 knot", color: "#003865" }
];

function initBmkgMap() {
  const mapContainer = document.getElementById('bmkgMap');
  if (!mapContainer || typeof L === 'undefined') return;

  bmkgMap = L.map('bmkgMap', {
    center: [-2.5489, 118.0149],
    zoom: 5,
    minZoom: 4,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: false
  });

  setTimeout(() => {
    if (bmkgMap) bmkgMap.invalidateSize();
  }, 250);

  window.addEventListener('resize', () => {
    if (bmkgMap) bmkgMap.invalidateSize();
  });

  basemapLayers = {
    street: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, HERE, Garmin, USGS | Data Observasi BMKG',
      maxZoom: 19
    }),
    topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, USGS, NOAA | Data Observasi BMKG',
      maxZoom: 19
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, Earthstar Geographics | Data Observasi BMKG',
      maxZoom: 19
    }),
    natgeo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; National Geographic Society, Esri | Data Observasi BMKG',
      maxZoom: 16
    })
  };

  activeBasemap = basemapLayers.street.addTo(bmkgMap);

  stasiunLayer = L.layerGroup().addTo(bmkgMap);
  gempaLayer = L.layerGroup().addTo(bmkgMap);

  // Plot Stasiun UPT
  stasiunList.forEach(st => {
    const marker = L.circleMarker([st.lat, st.lon], {
      radius: 8,
      fillColor: st.color,
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.95
    });
    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.5; padding: 2px;">
        <strong style="color: #003865; font-size: 14px;">${escapeHtml(st.nama)}</strong><br>
        <span style="color: #64748b; font-family: monospace;">WMO ID: ${escapeHtml(st.id)} • ${escapeHtml(st.tipe)}</span>
        <div style="background: #f1f7fc; padding: 6px 8px; border-radius: 6px; margin: 6px 0; font-size: 12px;">
          🌡️ Suhu Terkini: <strong>${escapeHtml(st.suhu)}</strong> | 💨 Angin: <strong>${escapeHtml(st.angin)}</strong>
        </div>
        <button onclick="applySearchTag('${escapeHtml(st.nama)}')" style="background: #005a9e; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%;">
          Buka Dataset Stasiun Ini &rarr;
        </button>
      </div>
    `);
    stasiunLayer.addLayer(marker);
  });

  // Render gempa awal dan polling live TEWS
  renderGempaMarkers();
  fetchLiveBMKGGempa();
  if (!window._bmkgTewsInterval) {
    window._bmkgTewsInterval = setInterval(fetchLiveBMKGGempa, 60000);
  }
}

function changeBasemap(styleKey) {
  if (!bmkgMap || !basemapLayers[styleKey]) return;
  bmkgMap.removeLayer(activeBasemap);
  activeBasemap = basemapLayers[styleKey].addTo(bmkgMap);
  if (stasiunLayer && bmkgMap.hasLayer(stasiunLayer)) stasiunLayer.bringToFront();
  if (gempaLayer && bmkgMap.hasLayer(gempaLayer)) gempaLayer.bringToFront();
  const names = {
    street: "Peta Berwarna (Esri Street Map)",
    topo: "Topografi Berwarna (Esri Topo)",
    satellite: "Citra Satelit Berwarna (Esri World)",
    natgeo: "National Geographic (Esri NatGeo)"
  };
  showToast(`Gaya peta diubah: ${names[styleKey] || styleKey}`);
}

function flyToRegion(region) {
  if (!bmkgMap) return;
  const coordinates = {
    indonesia: { center: [-2.5489, 118.0149], zoom: 5 },
    sumatera: { center: [0.5897, 101.3431], zoom: 6 },
    jawa: { center: [-7.2504, 109.9511], zoom: 7 },
    balinusra: { center: [-8.5568, 117.4300], zoom: 7 },
    sulawesi: { center: [-1.4300, 121.4456], zoom: 6 },
    papua: { center: [-4.2699, 138.0804], zoom: 6 }
  };

  const target = coordinates[region] || coordinates.indonesia;
  bmkgMap.flyTo(target.center, target.zoom, {
    duration: 1.5,
    easeLinearity: 0.25
  });
  showToast(`Navigasi kamera ke wilayah: ${region.toUpperCase()}`);
}

function toggleMapLayer(layerType) {
  if (!bmkgMap) return;
  if (layerType === 'stasiun') {
    const btn = document.getElementById('filterStasiun');
    if (bmkgMap.hasLayer(stasiunLayer)) {
      bmkgMap.removeLayer(stasiunLayer);
      if (btn) btn.classList.remove('active');
      showToast("Layer Stasiun Observasi dinonaktifkan");
    } else {
      bmkgMap.addLayer(stasiunLayer);
      if (btn) btn.classList.add('active');
      showToast("Layer Stasiun Observasi diaktifkan");
    }
  } else if (layerType === 'gempa') {
    const btn = document.getElementById('filterGempa');
    if (bmkgMap.hasLayer(gempaLayer)) {
      bmkgMap.removeLayer(gempaLayer);
      if (btn) btn.classList.remove('active');
      showToast("Layer Gempa M >= 5.0 dinonaktifkan");
    } else {
      bmkgMap.addLayer(gempaLayer);
      if (btn) btn.classList.add('active');
      showToast("Layer Gempa M >= 5.0 diaktifkan");
    }
  }
}

function toggleMapLegend(forceState) {
  const legendBox = document.getElementById('mapLegendBox');
  const toggleBtn = document.getElementById('legendToggleBtn');
  if (!legendBox) return;

  const isCollapsed = legendBox.classList.contains('collapsed');
  const shouldCollapse = forceState !== undefined ? forceState : !isCollapsed;

  if (shouldCollapse) {
    legendBox.classList.add('collapsed');
    if (toggleBtn) toggleBtn.setAttribute('title', 'Tampilkan Legenda');
    showToast("Legenda peta disembunyikan");
  } else {
    legendBox.classList.remove('collapsed');
    if (toggleBtn) toggleBtn.setAttribute('title', 'Sembunyikan Legenda');
    showToast("Legenda peta ditampilkan");
  }
}

function setGempaDisplayFilter(filterType) {
  window._activeGempaFilter = filterType;
  document.querySelectorAll('#filterGempaAll, #filterGempaM5, #filterGempaDirasakan').forEach(btn => btn.classList.remove('active'));
  if (filterType === 'all') {
    const b = document.getElementById('filterGempaAll');
    if (b) b.classList.add('active');
    showToast("Menampilkan Semua Episentrum Gempa BMKG TEWS");
  } else if (filterType === 'm5') {
    const b = document.getElementById('filterGempaM5');
    if (b) b.classList.add('active');
    showToast("Memfilter: Hanya Gempa M ≥ 5.0 Terkini");
  } else if (filterType === 'dirasakan') {
    const b = document.getElementById('filterGempaDirasakan');
    if (b) b.classList.add('active');
    showToast("Memfilter: Hanya Gempa Dirasakan Masyarakat");
  }
  renderGempaMarkers();
}

function renderGempaMarkers() {
  if (!gempaLayer) return;
  gempaLayer.clearLayers();
  const allItems = window._allGempaItems.length > 0 ? window._allGempaItems : fallbackGempaList;
  const filter = window._activeGempaFilter || 'all';

  const filteredItems = allItems.filter(g => {
    if (filter === 'm5') return g.mag >= 5.0 || g.kategori === 'm5';
    if (filter === 'dirasakan') return g.kategori === 'dirasakan' || (g.dirasakan && g.dirasakan.length > 0);
    return true;
  });

  filteredItems.forEach((g) => {
    const isLatest = g.isLatestLive === true;
    const isM5 = g.mag >= 5.0 || g.kategori === 'm5';
    let marker;

    if (isLatest) {
      const radarIcon = L.divIcon({
        className: 'tews-div-icon',
        html: `
          <div class="tews-radar-wrapper" title="Gempa Terkini Realtime: M ${g.mag}">
            <div class="tews-radar-ping"></div>
            <div class="tews-radar-core">M${g.mag}</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      marker = L.marker([g.lat, g.lon], { icon: radarIcon, zIndexOffset: 2000 });
    } else if (isM5) {
      const m5Icon = L.divIcon({
        className: 'gempa-marker-wrapper',
        html: `<div class="gempa-m5-badge" title="${escapeHtml(g.wilayah)} (M ${g.mag})"><span>●</span> M ${g.mag}</div>`,
        iconSize: [52, 22],
        iconAnchor: [26, 11]
      });
      marker = L.marker([g.lat, g.lon], { icon: m5Icon, zIndexOffset: 1000 });
    } else {
      const dirasakanIcon = L.divIcon({
        className: 'gempa-marker-wrapper',
        html: `<div class="gempa-dirasakan-badge" title="${escapeHtml(g.wilayah)} (M ${g.mag})"><span>📢</span> M ${g.mag}</div>`,
        iconSize: [50, 20],
        iconAnchor: [25, 10]
      });
      marker = L.marker([g.lat, g.lon], { icon: dirasakanIcon, zIndexOffset: 800 });
    }

    marker.bindTooltip(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600;">
        <span style="color: ${g.mag >= 5 ? '#dc2626' : '#d97706'}; font-weight: 800;">M ${g.mag}</span> — ${escapeHtml(g.wilayah)}<br>
        <span style="color: #64748b; font-size: 11px;">🕒 ${escapeHtml(g.tanggal)} • ⚓ ${escapeHtml(g.kedalaman)}</span>
      </div>
    `, { direction: 'top', offset: [0, -10] });

    const shakemapHtml = g.shakemap ? `
      <div style="margin-top: 8px; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1;">
        <a href="${g.shakemap}" target="_blank" rel="noreferrer" title="Buka Gambar Shakemap Resolusi Penuh">
          <img src="${g.shakemap}" alt="Peta Guncangan Shakemap BMKG" style="width: 100%; max-height: 130px; object-fit: cover; display: block;">
        </a>
        <div style="font-size: 10px; color: #64748b; text-align: center; padding: 2px 0; background: #f8fafc;">
          Klik gambar untuk melihat Shakemap penuh
        </div>
      </div>
    ` : '';

    const dirasakanHtml = g.dirasakan ? `
      <div style="font-size: 11px; color: #003865; background: #e8f1f8; border-left: 3px solid #005a9e; padding: 4px 7px; border-radius: 3px; margin-top: 6px; line-height: 1.4;">
        📢 <strong>Dirasakan:</strong> ${escapeHtml(g.dirasakan)}
      </div>
    ` : '';

    const badgeColor = isLatest ? '#dc2626' : (g.mag >= 5.0 ? '#dc2626' : '#0284c7');
    const badgeLabel = isLatest ? '🔴 GEMPA TERKINI (DETIK INI)' : (g.mag >= 5.0 ? '⚠️ GEMPA M ≥ 5.0' : '📢 GEMPA DIRASAKAN');

    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.5; min-width: 250px; max-width: 290px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span style="background: ${badgeColor}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 12px;">M ${g.mag}</span>
          <span style="font-size: 10px; color: ${badgeColor}; font-weight: 800; letter-spacing: 0.3px;">
            ${badgeLabel}
          </span>
        </div>
        <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 4px;">${escapeHtml(g.wilayah)}</strong>
        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
          <div>🕒 <strong>Waktu:</strong> ${escapeHtml(g.tanggal)}</div>
          <div>⚓ <strong>Kedalaman:</strong> ${escapeHtml(g.kedalaman)}</div>
          <div>📍 <strong>Koordinat:</strong> ${g.lat.toFixed(2)}, ${g.lon.toFixed(2)}</div>
        </div>
        ${dirasakanHtml}
        ${shakemapHtml}
        <div style="font-size: 11px; font-weight: 700; color: #00875a; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 6px;">
          🛡️ ${escapeHtml(g.status || 'Tidak berpotensi tsunami')}
        </div>
      </div>
    `);
    gempaLayer.addLayer(marker);
  });
}

async function fetchLiveBMKGGempa(isManual = false) {
  const headline = document.getElementById('liveTewsHeadline');
  const meta = document.getElementById('liveTewsMeta');
  const countAll = document.getElementById('countAllGempa');
  const countM5 = document.getElementById('countM5Gempa');
  const countDirasakan = document.getElementById('countDirasakanGempa');

  try {
    const cacheBuster = `?_t=${Date.now()}`;
    const [resAuto, resM5, resDirasakan] = await Promise.allSettled([
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json' + cacheBuster, { cache: 'no-store' }),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json' + cacheBuster, { cache: 'no-store' }),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json' + cacheBuster, { cache: 'no-store' })
    ]);

    let items = [];

    // 1. Autogempa (Gempa Realtime Terkini)
    if (resAuto.status === 'fulfilled' && resAuto.value.ok) {
      try {
        const autoJson = await resAuto.value.json();
        const g = autoJson?.Infogempa?.gempa;
        if (g && g.Coordinates) {
          const coords = g.Coordinates.split(',');
          items.push({
            wilayah: g.Wilayah,
            mag: parseFloat(g.Magnitude),
            kedalaman: g.Kedalaman,
            lat: parseFloat(coords[0]),
            lon: parseFloat(coords[1]),
            tanggal: `${g.Tanggal} ${g.Jam}`,
            jam: g.Jam,
            status: g.Potensi || 'Data Resmi BMKG TEWS',
            dirasakan: g.Dirasakan || '',
            shakemap: g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : null,
            isLatestLive: true,
            kategori: 'autogempa'
          });
        }
      } catch (e) {
        console.warn('Error parsing autogempa:', e);
      }
    }

    // 2. Gempaterkini (Daftar 15 Gempa M >= 5.0)
    let m5Count = 0;
    if (resM5.status === 'fulfilled' && resM5.value.ok) {
      try {
        const m5Json = await resM5.value.json();
        const rawM5 = m5Json?.Infogempa?.gempa;
        if (Array.isArray(rawM5)) {
          rawM5.forEach(g => {
            const coords = (g.Coordinates || '').split(',');
            const lat = parseFloat(coords[0]);
            const lon = parseFloat(coords[1]);
            const isDup = items.some(existing => 
              Math.abs(existing.lat - lat) < 0.05 && Math.abs(existing.lon - lon) < 0.05
            );
            if (!isDup && !isNaN(lat) && !isNaN(lon)) {
              m5Count++;
              items.push({
                wilayah: g.Wilayah,
                mag: parseFloat(g.Magnitude),
                kedalaman: g.Kedalaman,
                lat: lat,
                lon: lon,
                tanggal: `${g.Tanggal} ${g.Jam}`,
                jam: g.Jam,
                status: g.Potensi || 'Tidak berpotensi tsunami',
                dirasakan: '',
                shakemap: null,
                isLatestLive: false,
                kategori: 'm5'
              });
            }
          });
        }
      } catch (e) {
        console.warn('Error parsing gempaterkini:', e);
      }
    }

    // 3. Gempadirasakan (Daftar 15 Gempa Dirasakan)
    let dirasakanCount = 0;
    if (resDirasakan.status === 'fulfilled' && resDirasakan.value.ok) {
      try {
        const dirasakanJson = await resDirasakan.value.json();
        const rawDirasakan = dirasakanJson?.Infogempa?.gempa;
        if (Array.isArray(rawDirasakan)) {
          rawDirasakan.forEach(g => {
            const coords = (g.Coordinates || '').split(',');
            const lat = parseFloat(coords[0]);
            const lon = parseFloat(coords[1]);
            const isDup = items.some(existing => 
              Math.abs(existing.lat - lat) < 0.05 && Math.abs(existing.lon - lon) < 0.05
            );
            if (!isDup && !isNaN(lat) && !isNaN(lon)) {
              dirasakanCount++;
              items.push({
                wilayah: g.Wilayah,
                mag: parseFloat(g.Magnitude),
                kedalaman: g.Kedalaman,
                lat: lat,
                lon: lon,
                tanggal: `${g.Tanggal} ${g.Jam}`,
                jam: g.Jam,
                status: 'Gempa Dirasakan Masyarakat',
                dirasakan: g.Dirasakan || '',
                shakemap: null,
                isLatestLive: false,
                kategori: 'dirasakan'
              });
            }
          });
        }
      } catch (e) {
        console.warn('Error parsing gempadirasakan:', e);
      }
    }

    if (items.length > 0) {
      window._allGempaItems = items;
      renderGempaMarkers();

      const latest = items[0];
      if (headline) {
        headline.innerHTML = `<span style="background: #ef4444; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 800; margin-right: 6px;">M ${latest.mag}</span> ${escapeHtml(latest.wilayah)} (Kedalaman ${escapeHtml(latest.kedalaman)})`;
      }
      if (meta) {
        meta.textContent = latest.tanggal;
      }
      if (countAll) countAll.textContent = items.length;
      if (countM5) countM5.textContent = m5Count || 15;
      if (countDirasakan) countDirasakan.textContent = dirasakanCount || 15;

      if (isManual) {
        showToast(`Data BMKG TEWS diperbarui: ${items.length} titik gempa aktif`);
      }
      return;
    }
  } catch (err) {
    console.warn('Gagal memuat API Live BMKG TEWS, beralih ke observasi lokal:', err);
  }

  // Fallback lokal jika offline
  window._allGempaItems = fallbackGempaList;
  renderGempaMarkers();
  const fallbackLatest = fallbackGempaList[0];
  if (headline) {
    headline.innerHTML = `<span style="background: #ef4444; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 800; margin-right: 6px;">M ${fallbackLatest.mag}</span> ${escapeHtml(fallbackLatest.wilayah)} (Kedalaman ${escapeHtml(fallbackLatest.kedalaman)})`;
  }
  if (meta) {
    meta.textContent = fallbackLatest.tanggal;
  }
}
