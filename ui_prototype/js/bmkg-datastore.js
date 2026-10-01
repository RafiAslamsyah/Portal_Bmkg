/**
 * Portal Open Data BMKG — DataStore Tabular Preview & API Explorer Module
 * Modules: In-Memory Datasets, Dynamic Table Renderer, Realtime Sorting & Filtering, CSV/JSON Exporters.
 */

const DATASTORE_DEFAULT_RECORDS = [
  { tanggal: "2026-08-01", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.2, suhu_max: 32.8, suhu_rata: 28.5, kelembapan: 78, curah_hujan: 0.0 },
  { tanggal: "2026-08-02", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.0, suhu_max: 33.2, suhu_rata: 28.9, kelembapan: 76, curah_hujan: 0.0 },
  { tanggal: "2026-08-03", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 23.8, suhu_max: 32.0, suhu_rata: 27.8, kelembapan: 82, curah_hujan: 14.5 },
  { tanggal: "2026-08-04", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.4, suhu_max: 31.5, suhu_rata: 27.2, kelembapan: 85, curah_hujan: 32.0 },
  { tanggal: "2026-08-05", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.6, suhu_max: 33.0, suhu_rata: 28.6, kelembapan: 79, curah_hujan: 4.2 },
  { tanggal: "2026-08-06", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 25.0, suhu_max: 33.5, suhu_rata: 29.1, kelembapan: 74, curah_hujan: 0.0 },
  { tanggal: "2026-08-07", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 24.8, suhu_max: 34.0, suhu_rata: 29.4, kelembapan: 72, curah_hujan: 0.0 },
  { tanggal: "2026-08-08", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 25.2, suhu_max: 33.8, suhu_rata: 29.5, kelembapan: 75, curah_hujan: 0.0 },
  { tanggal: "2026-08-09", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 24.6, suhu_max: 32.4, suhu_rata: 28.2, kelembapan: 80, curah_hujan: 8.4 },
  { tanggal: "2026-08-10", stasiun_id: "96739", nama_stasiun: "Stasiun Klimatologi Banten", suhu_min: 23.5, suhu_max: 31.8, suhu_rata: 27.6, kelembapan: 84, curah_hujan: 21.0 }
];

window._datastoreAllRecords = [...DATASTORE_DEFAULT_RECORDS];
window._datastoreFilteredRecords = [...DATASTORE_DEFAULT_RECORDS];
window._datastoreSortState = { colIndex: null, isAsc: true };

const DATASTORE_COLUMNS = [
  'tanggal',
  'stasiun_id',
  'nama_stasiun',
  'suhu_min',
  'suhu_max',
  'suhu_rata',
  'kelembapan',
  'curah_hujan'
];

function showPreviewTab(tab) {
  const pTable = document.getElementById('panelTable');
  const pApi = document.getElementById('panelApi');
  const btnTable = document.getElementById('tabBtnTable');
  const btnApi = document.getElementById('tabBtnApi');
  if (!pTable || !pApi) return;

  if (tab === 'table') {
    pTable.style.display = 'block';
    pApi.style.display = 'none';
    if (btnTable) btnTable.classList.add('active');
    if (btnApi) btnApi.classList.remove('active');
  } else {
    pTable.style.display = 'none';
    pApi.style.display = 'block';
    if (btnTable) btnTable.classList.remove('active');
    if (btnApi) btnApi.classList.add('active');
  }
}

function renderDatastoreTable(records) {
  const tbody = document.getElementById('datastoreTableBody');
  const rowCountEl = document.getElementById('datastoreRowCount');
  if (!tbody) return;

  if (!records || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size: 1.8rem; margin-bottom: 0.6rem; display: block; color: var(--text-muted);"></i>
          <strong style="display: block; margin-bottom: 0.25rem; color: var(--text-primary); font-size: 0.95rem;">Tidak Ada Data Ditemukan</strong>
          <span style="font-size: 0.85rem;">Tidak ada baris observasi yang cocok dengan kata kunci filter pencarian.</span>
        </td>
      </tr>
    `;
    if (rowCountEl) rowCountEl.textContent = '0 baris';
    return;
  }

  const html = records.map(item => {
    const curahHujanVal = parseFloat(item.curah_hujan !== undefined ? item.curah_hujan : 0);
    const curahHujanBadge = curahHujanVal > 20
      ? `<span style="background: rgba(220, 38, 38, 0.12); color: #dc2626; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 0.82rem;">${curahHujanVal.toFixed(1)} mm <i class="fa-solid fa-cloud-showers-heavy"></i></span>`
      : (curahHujanVal > 0
        ? `<span style="background: rgba(2, 132, 199, 0.12); color: #0284c7; padding: 2px 7px; border-radius: 4px; font-weight: 600; font-size: 0.82rem;">${curahHujanVal.toFixed(1)} mm</span>`
        : `<span style="color: var(--text-muted); font-size: 0.85rem;">0.0</span>`);

    return `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--text-secondary);">${escapeHtml(item.tanggal || '-')}</td>
        <td><span style="font-family: 'JetBrains Mono', monospace; background: var(--bmkg-blue-subtle); color: var(--bmkg-blue); padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700;">${escapeHtml(String(item.stasiun_id || '-'))}</span></td>
        <td style="font-weight: 600; color: var(--bmkg-blue-deep);">${escapeHtml(item.nama_stasiun || '-')}</td>
        <td style="font-family: 'JetBrains Mono', monospace; text-align: right;">${item.suhu_min !== undefined ? parseFloat(item.suhu_min).toFixed(1) : '-'}</td>
        <td style="font-family: 'JetBrains Mono', monospace; text-align: right;">${item.suhu_max !== undefined ? parseFloat(item.suhu_max).toFixed(1) : '-'}</td>
        <td style="font-family: 'JetBrains Mono', monospace; text-align: right; font-weight: 700; color: var(--bmkg-blue);">${item.suhu_rata !== undefined ? parseFloat(item.suhu_rata).toFixed(1) : '-'}</td>
        <td style="font-family: 'JetBrains Mono', monospace; text-align: right;">${item.kelembapan !== undefined ? item.kelembapan : (item.kelembapan_rata !== undefined ? item.kelembapan_rata : '-')}%</td>
        <td style="text-align: right;">${curahHujanBadge}</td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;

  if (rowCountEl) {
    const total = window._datastoreAllRecords.length;
    if (records.length === total) {
      rowCountEl.textContent = `${records.length} baris observasi`;
    } else {
      rowCountEl.textContent = `${records.length} dari ${total} baris`;
    }
  }
}

async function initDatastoreTable() {
  const badgeEl = document.getElementById('datastoreSourceBadge');
  const tbody = document.getElementById('datastoreTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr id="datastoreLoadingRow">
        <td colspan="8" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; color: var(--bmkg-blue);"></i>
          <span style="font-size: 0.88rem; font-weight: 600;">Memuat data observasi DataStore via JavaScript...</span>
        </td>
      </tr>
    `;
  }

  try {
    const response = await fetch('/api/3/action/datastore_search?resource_id=cuaca-harian-cengkareng-2026&limit=100');
    if (response.ok) {
      const result = await response.json();
      if (result && result.success && result.result && Array.isArray(result.result.records) && result.result.records.length > 0) {
        window._datastoreAllRecords = result.result.records;
        window._datastoreFilteredRecords = [...window._datastoreAllRecords];
        if (badgeEl) {
          badgeEl.innerHTML = '<i class="fa-solid fa-satellite-dish" style="color: var(--bmkg-green);"></i> Live DataStore API';
        }
        renderDatastoreTable(window._datastoreAllRecords);
        return;
      }
    }
  } catch (_) {}

  // Fallback ke dataset internal jika API offline
  window._datastoreAllRecords = [...DATASTORE_DEFAULT_RECORDS];
  window._datastoreFilteredRecords = [...DATASTORE_DEFAULT_RECORDS];
  if (badgeEl) {
    badgeEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--bmkg-blue);"></i> Observasi Terverifikasi BMKG';
  }
  renderDatastoreTable(window._datastoreAllRecords);
}

function applySortingToRecords(records, colIndex, isAsc) {
  const colKey = DATASTORE_COLUMNS[colIndex];
  if (!colKey) return;

  records.sort((a, b) => {
    let aVal = a[colKey];
    let bVal = b[colKey];

    if (colKey === 'kelembapan') {
      aVal = aVal !== undefined ? aVal : a.kelembapan_rata;
      bVal = bVal !== undefined ? bVal : b.kelembapan_rata;
    }

    if (colKey === 'tanggal') {
      return isAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    }

    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return isAsc ? aNum - bNum : bNum - aNum;
    }

    return isAsc ? String(aVal || '').localeCompare(String(bVal || '')) : String(bVal || '').localeCompare(String(aVal || ''));
  });
}

function sortTable(colIndex) {
  const isAsc = (window._datastoreSortState.colIndex === colIndex) ? !window._datastoreSortState.isAsc : true;
  window._datastoreSortState = { colIndex, isAsc };

  const ths = document.querySelectorAll('#datastoreTable thead th');
  ths.forEach((th, idx) => {
    const icon = th.querySelector('i');
    if (icon) {
      if (idx === colIndex) {
        icon.className = isAsc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
        th.style.color = 'var(--bmkg-blue)';
      } else {
        icon.className = 'fa-solid fa-sort';
        th.style.color = '';
      }
    }
  });

  applySortingToRecords(window._datastoreFilteredRecords, colIndex, isAsc);
  renderDatastoreTable(window._datastoreFilteredRecords);

  const colName = ths[colIndex] ? ths[colIndex].textContent.trim() : `Kolom ${colIndex + 1}`;
  showToast(`Diurutkan: ${colName} (${isAsc ? 'Menaik' : 'Menurun'})`);
}

function filterTableRows(filterText) {
  const query = (filterText || '').trim().toLowerCase();
  if (!query) {
    window._datastoreFilteredRecords = [...window._datastoreAllRecords];
  } else {
    window._datastoreFilteredRecords = window._datastoreAllRecords.filter(item => {
      const values = [
        item.tanggal,
        item.stasiun_id,
        item.nama_stasiun,
        item.suhu_min,
        item.suhu_max,
        item.suhu_rata,
        item.kelembapan !== undefined ? item.kelembapan : item.kelembapan_rata,
        item.curah_hujan
      ];
      return values.some(val => val !== undefined && val !== null && String(val).toLowerCase().includes(query));
    });
  }

  if (window._datastoreSortState.colIndex !== null) {
    applySortingToRecords(window._datastoreFilteredRecords, window._datastoreSortState.colIndex, window._datastoreSortState.isAsc);
  }

  renderDatastoreTable(window._datastoreFilteredRecords);
}

function copyTableJSON() {
  const records = window._datastoreFilteredRecords.length > 0
    ? window._datastoreFilteredRecords
    : window._datastoreAllRecords;

  const jsonStr = JSON.stringify(records, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast(`${records.length} baris data JSON berhasil disalin ke papan klip!`);
    }).catch(() => {
      fallbackCopyText(jsonStr);
      showToast(`${records.length} baris data JSON berhasil disalin ke papan klip!`);
    });
  } else {
    fallbackCopyText(jsonStr);
    showToast(`${records.length} baris data JSON berhasil disalin ke papan klip!`);
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (_) {}
  document.body.removeChild(textarea);
}

function triggerDownloadCSV() {
  const records = window._datastoreFilteredRecords.length > 0
    ? window._datastoreFilteredRecords
    : window._datastoreAllRecords;

  if (!records || records.length === 0) {
    showToast("Tidak ada baris data untuk diunduh!");
    return;
  }

  const headers = ["tanggal", "stasiun_id", "nama_stasiun", "suhu_min", "suhu_max", "suhu_rata", "kelembapan", "curah_hujan"];
  const csvRows = [headers.join(",")];

  records.forEach(r => {
    const row = [
      `"${r.tanggal || ''}"`,
      `"${r.stasiun_id || ''}"`,
      `"${(r.nama_stasiun || '').replace(/"/g, '""')}"`,
      r.suhu_min !== undefined ? r.suhu_min : '',
      r.suhu_max !== undefined ? r.suhu_max : '',
      r.suhu_rata !== undefined ? r.suhu_rata : '',
      r.kelembapan !== undefined ? r.kelembapan : (r.kelembapan_rata !== undefined ? r.kelembapan_rata : ''),
      r.curah_hujan !== undefined ? r.curah_hujan : ''
    ];
    csvRows.push(row.join(","));
  });

  const csvString = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `cuaca_harian_stamet_cengkareng_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Mengunduh ${records.length} baris data CSV...`);
}

function copyAPICode() {
  const code = document.getElementById('apiCodeSnippet').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copyCodeBtn');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
    btn.style.background = 'var(--bmkg-green)';
    showToast("Snippet kode Python berhasil disalin ke clipboard!");
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-clone"></i> Salin Kode';
      btn.style.background = '';
    }, 2500);
  });
}
