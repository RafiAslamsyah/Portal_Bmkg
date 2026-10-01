/**
 * Portal Open Data BMKG — Landing Page Search & Pillar Analytics Module
 * Modules: Live Search API Debouncer, Tag Shortcuts, 4 Pillars Filter, Realtime Metrics Sync.
 */

let liveSearchTimer = null;

function handleLiveSearch(query) {
  const feedback = document.getElementById('liveSearchFeedback');
  if (!feedback) return;
  const clean = query ? query.trim() : '';
  if (!clean) {
    feedback.innerHTML = "";
    if (liveSearchTimer) clearTimeout(liveSearchTimer);
    return;
  }

  if (liveSearchTimer) clearTimeout(liveSearchTimer);
  feedback.innerHTML = '<span style="color: #64748b; font-weight: 500;"><i class="fa-solid fa-spinner fa-spin"></i> Mencari dataset...</span>';

  liveSearchTimer = setTimeout(() => {
    fetch('/api/3/action/package_search?q=' + encodeURIComponent(clean) + '&rows=5')
      .then(response => {
        if (!response.ok) throw new Error('API unavailable');
        return response.json();
      })
      .then(data => {
        if (data && data.success && data.result) {
          const count = data.result.count;
          const cleanSafe = escapeHtml(clean);
          const isStandalone = window.location.protocol === 'file:' || window.location.pathname.includes('ui_prototype');
          const targetUrl = isStandalone ? `katalog.html?q=${encodeURIComponent(clean)}` : `/dataset/?q=${encodeURIComponent(clean)}`;
          if (count > 0) {
            feedback.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Ditemukan <strong>${count} dataset</strong> untuk "<em>${cleanSafe}</em>" &mdash; <a href="${targetUrl}" style="color: var(--bmkg-blue); text-decoration: underline; font-weight: 700; margin-left: 4px;">Lihat semua hasil &rarr;</a>`;
          } else {
            feedback.innerHTML = `<i class="fa-solid fa-circle-info" style="color: #64748b;"></i> Tidak ditemukan dataset untuk kata kunci "<em>${cleanSafe}</em>". <a href="${isStandalone ? 'katalog.html' : '/dataset/'}" style="color: var(--bmkg-blue); text-decoration: underline; font-weight: 600; margin-left: 4px;">Lihat semua dataset</a>`;
          }
        } else {
          feedback.innerHTML = "";
        }
      })
      .catch(() => {
        const isStandalone = window.location.protocol === 'file:' || window.location.pathname.includes('ui_prototype');
        const cleanSafe = escapeHtml(clean);
        const targetUrl = isStandalone ? `katalog.html?q=${encodeURIComponent(clean)}` : `/dataset/?q=${encodeURIComponent(clean)}`;
        feedback.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Cari dataset "<em>${cleanSafe}</em>" &mdash; <a href="${targetUrl}" style="color: var(--bmkg-blue); text-decoration: underline; font-weight: 700; margin-left: 4px;">Buka Hasil &rarr;</a>`;
      });
  }, 300);
}

function applySearchTag(tagText) {
  const input = document.getElementById('portalSearchInput');
  if (input) {
    input.value = tagText;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
  }
  const isStandalone = window.location.protocol === 'file:' || window.location.pathname.includes('ui_prototype');
  const targetUrl = isStandalone ? `katalog.html?q=${encodeURIComponent(tagText)}` : `/dataset/?q=${encodeURIComponent(tagText)}`;
  window.location.href = targetUrl;
}

function executeSearch() {
  const input = document.getElementById('portalSearchInput');
  const query = input ? input.value.trim() : '';
  if (!query) {
    showToast("Silakan ketik kata kunci pencarian dataset terlebih dahulu");
    return;
  }
  showToast(`Mencari dataset: "${query}"`);
  const isStandalone = window.location.protocol === 'file:' || window.location.pathname.includes('ui_prototype');
  const targetUrl = isStandalone ? `katalog.html?q=${encodeURIComponent(query)}` : `/dataset/?q=${encodeURIComponent(query)}`;
  window.location.href = targetUrl;
}

function filterByPilar(pilar, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const isStandalone = window.location.protocol === 'file:' || window.location.pathname.includes('ui_prototype');
  const targetUrl = isStandalone ? `katalog.html?pilar=${encodeURIComponent(pilar)}` : `/dataset/?groups=${encodeURIComponent(pilar)}`;
  window.location.href = targetUrl;
}

async function initDynamicLandingStats() {
  const elTotal = document.getElementById('totalDatasetCount');
  const elOrg = document.getElementById('totalOrgCount');
  const elMet = document.getElementById('countPilarMeteorologi');
  const elKlim = document.getElementById('countPilarKlimatologi');
  const elGeof = document.getElementById('countPilarGeofisika');
  const elKu = document.getElementById('countPilarKualitasUdara');

  // 1. Coba ambil dari live CKAN API
  try {
    const res = await fetch('/api/3/action/package_search?facet.field=["groups"]&facet.limit=10&rows=0', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const total = data.result.count || 0;
        if (elTotal) elTotal.textContent = total;

        const groupFacets = data.result.facets && data.result.facets.groups ? data.result.facets.groups : {};
        if (elMet) elMet.textContent = `${groupFacets['meteorologi'] || 0} Dataset`;
        if (elKlim) elKlim.textContent = `${groupFacets['klimatologi'] || 0} Dataset`;
        if (elGeof) elGeof.textContent = `${groupFacets['geofisika'] || 0} Dataset`;
        if (elKu) elKu.textContent = `${groupFacets['kualitas-udara'] || 0} Dataset`;

        try {
          const resOrg = await fetch('/api/3/action/organization_list', { cache: 'no-cache' });
          if (resOrg.ok) {
            const dataOrg = await resOrg.json();
            if (dataOrg.success && elOrg) {
              elOrg.textContent = `${dataOrg.result.length} Unit`;
            }
          }
        } catch (_) {}
        return;
      }
    }
  } catch (_) {}

  // 2. Fallback ke localStorage
  try {
    const stored = localStorage.getItem('bmkg_datasets') || localStorage.getItem('portal_bmkg_datasets');
    let datasets = [];
    if (stored) {
      datasets = JSON.parse(stored);
    }
    if (!datasets || datasets.length === 0) {
      if (elTotal) elTotal.textContent = '1';
      if (elMet) elMet.textContent = '1 Dataset';
      if (elKlim) elKlim.textContent = '0 Dataset';
      if (elGeof) elGeof.textContent = '0 Dataset';
      if (elKu) elKu.textContent = '0 Dataset';
      if (elOrg) elOrg.textContent = '2 Unit';
      return;
    }

    const counts = { meteorologi: 0, klimatologi: 0, geofisika: 0, 'kualitas-udara': 0 };
    const orgs = new Set();

    datasets.forEach(d => {
      const p = (d.pilar || d.pilar_mkg || '').toLowerCase();
      if (counts[p] !== undefined) counts[p]++;
      if (d.owner_org || d.organisasi || d.producer) orgs.add(d.owner_org || d.organisasi || d.producer);
    });

    if (elTotal) elTotal.textContent = datasets.length;
    if (elMet) elMet.textContent = `${counts.meteorologi} Dataset`;
    if (elKlim) elKlim.textContent = `${counts.klimatologi} Dataset`;
    if (elGeof) elGeof.textContent = `${counts.geofisika} Dataset`;
    if (elKu) elKu.textContent = `${counts['kualitas-udara']} Dataset`;
    if (elOrg) elOrg.textContent = `${Math.max(orgs.size, 1)} Unit`;
  } catch (e) {
    console.warn('Error membaca dataset lokal:', e);
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === 'bmkg_datasets' || e.key === 'portal_bmkg_datasets') {
    initDynamicLandingStats();
  }
});
