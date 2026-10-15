# encoding: utf-8
import os
import csv
import io
import time
import urllib.request
import json
import re
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request, Response, make_response
import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit

bmkg_api_blueprint = Blueprint('bmkg_api', __name__)

_CACHED_GEMPA = []
_LAST_GEMPA_FETCH = 0
_GEMPA_CACHE_TTL = 30  # 30 detik cache in-memory

def _with_cors(resp):
    """Lampirkan header CORS standar terbuka untuk publikasi API."""
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
    resp.headers['Access-Control-Max-Age'] = '86400'
    return resp

def _fetch_bmkg_realtime_events():
    global _CACHED_GEMPA, _LAST_GEMPA_FETCH
    now = time.time()
    if _CACHED_GEMPA and (now - _LAST_GEMPA_FETCH < _GEMPA_CACHE_TTL):
        return _CACHED_GEMPA

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
    }
    req = urllib.request.Request('https://www.bmkg.go.id/gempabumi/gempabumi-realtime', headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')

        m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if not m:
            return _CACHED_GEMPA

        data = json.loads(m.group(1))
        def resolve(val):
            if isinstance(val, int) and 0 <= val < len(data):
                return data[val]
            return val

        events = []
        for item in data:
            if isinstance(item, dict) and 'eventid' in item and 'mag' in item:
                try:
                    eventid = resolve(item.get('eventid'))
                    waktu_str = resolve(item.get('waktu'))
                    lat = float(resolve(item.get('lintang')))
                    lon = float(resolve(item.get('bujur')))
                    dalam = resolve(item.get('dalam'))
                    mag = float(resolve(item.get('mag')))
                    area = resolve(item.get('area'))
                    status = resolve(item.get('status'))

                    # Konversi UTC ke WIB (+7)
                    try:
                        clean_w = ' '.join(str(waktu_str).split())
                        dt_utc = datetime.strptime(clean_w.split('.')[0], '%Y/%m/%d %H:%M:%S')
                        dt_wib = dt_utc + timedelta(hours=7)
                        tanggal_wib = dt_wib.strftime('%d %b %Y %H:%M:%S WIB')
                        jam_wib = dt_wib.strftime('%H:%M:%S WIB')
                    except Exception:
                        tanggal_wib = str(waktu_str)
                        jam_wib = ''

                    events.append({
                        'id': str(eventid),
                        'mag': mag,
                        'kedalaman': f"{dalam} km" if isinstance(dalam, (int, float)) else str(dalam),
                        'lat': lat,
                        'lon': lon,
                        'tanggal': tanggal_wib,
                        'jam': jam_wib,
                        'wilayah': str(area) if area else 'Wilayah Indonesia',
                        'status': 'Dikonfirmasi Seismolog' if status == 'confirmed' else 'Deteksi Otomatis Real-time',
                        'dirasakan': '',
                        'shakemap': None,
                        'isLatestLive': False,
                        'kategori': 'm5' if mag >= 5.0 else ('mikro' if mag < 3.0 else 'm3')
                    })
                except Exception:
                    continue

        if events:
            events[0]['isLatestLive'] = True
            _CACHED_GEMPA = events
            _LAST_GEMPA_FETCH = now
            return events
    except Exception:
        if _CACHED_GEMPA:
            return _CACHED_GEMPA
    return []

@bmkg_api_blueprint.route('/api/gempa/realtime', methods=['GET', 'OPTIONS'])
def get_bmkg_gempa_realtime():
    if request.method == 'OPTIONS':
        return _with_cors(make_response('', 204))
    events = _fetch_bmkg_realtime_events()
    resp = jsonify(events)
    resp.headers['Cache-Control'] = 'public, max-age=15'
    return _with_cors(resp)


# ============================================================================
# HELPER & ROUTE: PUBLIC CSV REST API PORTAL OPEN DATA BMKG
# ============================================================================

def _find_csv_resource_in_package(pkg):
    """Cari resource berformat CSV terbaik dari suatu dataset CKAN."""
    if not pkg:
        return None
    resources = pkg.get('resources', []) if isinstance(pkg, dict) else getattr(pkg, 'resources', [])

    # 1. Prioritas utama: resource CSV yang memiliki DataStore PostgreSQL aktif
    for r in resources:
        fmt = (r.get('format', '') if isinstance(r, dict) else getattr(r, 'format', '')).lower().strip()
        url = (r.get('url', '') if isinstance(r, dict) else getattr(r, 'url', '')).lower().strip()
        ds = r.get('datastore_active') if isinstance(r, dict) else getattr(r, 'datastore_active', False)
        if ('csv' in fmt or url.endswith('.csv')) and ds:
            return r

    # 2. Prioritas kedua: berkas dengan format CSV atau ekstensi .csv
    for r in resources:
        fmt = (r.get('format', '') if isinstance(r, dict) else getattr(r, 'format', '')).lower().strip()
        url = (r.get('url', '') if isinstance(r, dict) else getattr(r, 'url', '')).lower().strip()
        if 'csv' in fmt or url.endswith('.csv'):
            return r

    return None

def _resolve_csv_dataset(identifier):
    """
    Mengurai identifier menjadi tuple (package_dict, resource_dict).
    Identifier bisa berupa:
    - nama/slug package (misal: 'cuaca-harian-cengkareng')
    - ID UUID package
    - ID UUID resource langsung (resource/UUID atau UUID)
    """
    clean_id = (identifier or '').strip()
    if clean_id.startswith('resource/'):
        clean_id = clean_id[len('resource/'):]

    # Coba sebagai Resource ID dulu jika berbentuk UUID
    try:
        res = toolkit.get_action('resource_show')({'ignore_auth': True}, {'id': clean_id})
        if res and res.get('package_id'):
            pkg = toolkit.get_action('package_show')({'ignore_auth': True}, {'id': res['package_id']})
            return pkg, res
    except Exception:
        pass

    # Coba sebagai Package ID / Name (Slug)
    try:
        pkg = toolkit.get_action('package_show')({'ignore_auth': True}, {'id': clean_id})
        if pkg:
            res = _find_csv_resource_in_package(pkg)
            return pkg, res
    except Exception:
        pass

    return None, None

def _read_csv_file_rows(res):
    """
    Membaca baris CSV dari media penyimpanan lokal CKAN (FileStore)
    atau fallback melalui URL unduhan.
    """
    if not res:
        return [], []

    # 1. Cek penyimpanan lokal CKAN FileStore
    storage_path = toolkit.config.get('ckan.storage_path', '/var/lib/ckan/default')
    res_id = res.get('id', '')
    if len(res_id) >= 6:
        file_path = os.path.join(storage_path, 'resources', res_id[0:3], res_id[3:6], res_id[6:])
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    reader = csv.DictReader(f)
                    fieldnames = reader.fieldnames or []
                    rows = list(reader)
                    return rows, fieldnames
            except Exception:
                pass

    # 2. Cek URL resource
    url = res.get('url', '')
    if url:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'BMKG-OpenData-API/1.0'})
            with urllib.request.urlopen(req, timeout=8) as resp:
                content = resp.read().decode('utf-8', errors='replace')
                reader = csv.DictReader(io.StringIO(content))
                fieldnames = reader.fieldnames or []
                rows = list(reader)
                return rows, fieldnames
        except Exception:
            pass

    return [], []

def _fetch_csv_records(pkg, res, limit=100, offset=0, q='', sort='', col_filters=None):
    """
    Mengambil record dataset CSV dari DataStore atau FileStore,
    lengkap dengan dukungan filter keyword, sortir, kolom, dan paginasi.
    """
    if not res:
        return [], [], 0, 'none', []

    col_filters = col_filters or {}

    # ----------------------------------------------------
    # PATH A: RESOURCE MEMILIKI DATASTORE POSTGRESQL AKTIF
    # ----------------------------------------------------
    if res.get('datastore_active'):
        try:
            params = {
                'resource_id': res['id'],
                'include_total': True,
                'offset': max(0, offset),
            }
            if limit > 0:
                params['limit'] = min(limit, 10000)
            else:
                params['limit'] = 10000

            if q:
                params['q'] = q
            if sort:
                params['sort'] = sort
            if col_filters:
                params['filters'] = col_filters

            res_ds = toolkit.get_action('datastore_search')({'ignore_auth': True}, params)
            records = res_ds.get('records', [])
            fields_meta = res_ds.get('fields', [])
            total = res_ds.get('total', len(records))

            fieldnames = [f.get('id') for f in fields_meta if f.get('id') != '_id']
            # Bersihkan _id internal CKAN jika ada
            clean_records = []
            for r in records:
                item = {k: v for k, v in r.items() if k != '_id'}
                clean_records.append(item)

            return clean_records, fieldnames, total, 'datastore', fields_meta
        except Exception:
            pass

    # ----------------------------------------------------
    # PATH B: RESOURCE BERUPA BERKAS CSV LOKAL / URL
    # ----------------------------------------------------
    rows, fieldnames = _read_csv_file_rows(res)
    if not rows:
        return [], fieldnames, 0, 'filestore', [{'id': fn, 'type': 'text'} for fn in fieldnames]

    # Filter berdasarkan query kolom (misal: ?provinsi=Jawa+Barat)
    filtered = rows
    if col_filters:
        for col_name, filter_val in col_filters.items():
            filter_val_clean = str(filter_val).strip().lower()
            filtered = [
                r for r in filtered
                if str(r.get(col_name, '')).strip().lower() == filter_val_clean
            ]

    # Filter keyword pencarian bebas (?q=...)
    if q:
        q_lower = str(q).strip().lower()
        filtered = [
            r for r in filtered
            if any(q_lower in str(v).lower() for v in r.values())
        ]

    # Sortir (?sort=col [asc|desc])
    if sort:
        parts = sort.strip().split()
        sort_col = parts[0]
        sort_desc = len(parts) > 1 and parts[1].lower() == 'desc'
        try:
            filtered.sort(
                key=lambda x: (
                    float(x.get(sort_col, 0))
                    if str(x.get(sort_col, '')).replace('.', '', 1).isdigit()
                    else str(x.get(sort_col, ''))
                ),
                reverse=sort_desc
            )
        except Exception:
            pass

    total = len(filtered)
    # Paginasi (limit & offset)
    if limit > 0:
        sliced_records = filtered[offset : offset + limit]
    else:
        sliced_records = filtered[offset:]

    fields_meta = [{'id': fn, 'type': 'text'} for fn in fieldnames]
    return sliced_records, fieldnames, total, 'filestore', fields_meta

def _compute_schema_summary(records, fields_meta):
    """Menganalisis skema tipe data, statistik rentang nilai, dan nilai sampel."""
    schema = []
    for f in fields_meta:
        field_id = f.get('id')
        if field_id == '_id':
            continue

        values = [r.get(field_id) for r in records if r.get(field_id) is not None and r.get(field_id) != '']
        non_null_count = len(values)

        # Deteksi tipe data
        inferred_type = f.get('type') or 'text'
        numeric_vals = []
        for v in values:
            try:
                numeric_vals.append(float(v))
            except (ValueError, TypeError):
                pass

        if numeric_vals and len(numeric_vals) == len(values):
            inferred_type = 'numeric'
            min_val = min(numeric_vals)
            max_val = max(numeric_vals)
            avg_val = round(sum(numeric_vals) / len(numeric_vals), 2)
        else:
            min_val = None
            max_val = None
            avg_val = None

        unique_samples = list(dict.fromkeys(str(v) for v in values))[:4]

        col_info = {
            'column': field_id,
            'type': inferred_type,
            'non_null_count': non_null_count,
            'sample_values': unique_samples,
        }
        if min_val is not None:
            col_info['stats'] = {
                'min': min_val,
                'max': max_val,
                'mean': avg_val
            }
        schema.append(col_info)

    return schema


# ----------------------------------------------------------------------------
# 1. API ROOT & DOKUMENTASI LENGKAP: GET /api/csv & GET /api/csv/docs
# ----------------------------------------------------------------------------
@bmkg_api_blueprint.route('/api/csv', methods=['GET', 'OPTIONS'])
@bmkg_api_blueprint.route('/api/csv/docs', methods=['GET', 'OPTIONS'])
def get_csv_api_docs():
    """Dokumentasi interaktif & spesifikasi REST API Dataset CSV BMKG untuk publik."""
    if request.method == 'OPTIONS':
        return _with_cors(make_response('', 204))

    base_url = request.host_url.rstrip('/')
    doc_data = {
        'service': 'Portal Open Data BMKG - Public CSV REST API',
        'version': '1.0.0',
        'description': (
            'Endpoint API resmi terbuka untuk mengakses, memfilter, mengunduh, dan menganalisis '
            'seluruh dataset berformat CSV dari 5 Pilar Layanan BMKG (Meteorologi, Klimatologi, '
            'Geofisika, Instrumen MKG, Modifikasi Cuaca).'
        ),
        'compliance': 'Perpres No. 39/2019 Satu Data Indonesia (SDI) & WMO Open Data Policy',
        'base_url': f"{base_url}/api/csv",
        'endpoints': {
            'list_datasets': {
                'method': 'GET',
                'url': f"{base_url}/api/csv/datasets",
                'description': 'Daftar seluruh dataset CSV terbuka yang tersedia beserta metadata dan endpoint spesifiknya.',
                'params': {'q': 'Filter kata kunci pencarian', 'pillar': 'meteorologi | klimatologi | geofisika | instrumen-mkg | modifikasi-cuaca'}
            },
            'get_data_json': {
                'method': 'GET',
                'url': f"{base_url}/api/csv/<dataset_name>",
                'description': 'Mengambil isi baris data dataset CSV dalam bentuk JSON berstruktur.',
                'params': {
                    'limit': 'Jumlah baris (default: 100, maks: 10000, 0 untuk semua)',
                    'offset': 'Indeks baris awal (paginasi)',
                    'q': 'Pencarian kata kunci di seluruh kolom',
                    'sort': 'Nama kolom untuk pengurutan, contoh: suhu_max desc, tanggal asc',
                    '<nama_kolom>': 'Filter nilai kolom spesifik, contoh: stasiun_id=96749 atau provinsi=Jawa+Barat'
                }
            },
            'get_raw_csv': {
                'method': 'GET',
                'url': f"{base_url}/api/csv/<dataset_name>.csv",
                'description': 'Mengambil atau mengunduh langsung berkas stream murni format CSV (RFC 4180).',
                'params': {
                    'download': 'Set 1 atau true untuk memicu unduhan berkas (Content-Disposition: attachment)',
                    'limit': 'Batasi jumlah baris yang diunduh (opsional)'
                }
            },
            'get_schema': {
                'method': 'GET',
                'url': f"{base_url}/api/csv/<dataset_name>/schema",
                'description': 'Mendapatkan deskripsi kolom, tipe data terdeteksi, ringkasan statistik (min/max/mean), dan sampel nilai.'
            }
        },
        'code_examples': {
            'curl': f"curl -X GET \"{base_url}/api/csv/cuaca-harian-cengkareng?limit=5\"",
            'python_pandas': (
                "import pandas as pd\n"
                f"df = pd.read_csv('{base_url}/api/csv/cuaca-harian-cengkareng.csv')\n"
                "print(df.head())"
            ),
            'python_requests': (
                "import requests\n"
                f"res = requests.get('{base_url}/api/csv/cuaca-harian-cengkareng', params={{'limit': 10}})\n"
                "data = res.json()\n"
                "print('Total baris:', data['meta']['total_records'])\n"
                "print(data['data'])"
            ),
            'javascript_fetch': (
                f"fetch('{base_url}/api/csv/cuaca-harian-cengkareng?limit=10')\n"
                "  .then(res => res.json())\n"
                "  .then(json => console.log('Data BMKG:', json.data))\n"
                "  .catch(err => console.error(err));"
            ),
            'r': f"df <- read.csv('{base_url}/api/csv/cuaca-harian-cengkareng.csv')"
        }
    }
    resp = jsonify(doc_data)
    resp.headers['Cache-Control'] = 'public, max-age=300'
    return _with_cors(resp)


# ----------------------------------------------------------------------------
# 2. KATALOG DATASET CSV: GET /api/csv/datasets & GET /api/csv/list
# ----------------------------------------------------------------------------
@bmkg_api_blueprint.route('/api/csv/datasets', methods=['GET', 'OPTIONS'])
@bmkg_api_blueprint.route('/api/csv/list', methods=['GET', 'OPTIONS'])
def list_csv_datasets():
    """Mengembalikan daftar seluruh dataset CSV publik yang tersedia di CKAN BMKG."""
    if request.method == 'OPTIONS':
        return _with_cors(make_response('', 204))

    q = request.args.get('q', '').strip()
    pillar_filter = request.args.get('pillar', '').strip().lower()

    try:
        search_query = '*:*'
        if q:
            search_query = q
        packages_res = toolkit.get_action('package_search')({'ignore_auth': True}, {'q': search_query, 'rows': 100})
        pkg_list = packages_res.get('results', [])
    except Exception:
        pkg_list = []

    base_url = request.host_url.rstrip('/')
    datasets_data = []

    for pkg in pkg_list:
        if pkg.get('private'):
            continue

        csv_res = _find_csv_resource_in_package(pkg)
        if not csv_res:
            continue

        pkg_name = pkg.get('name')
        pilar = 'meteorologi'
        groups = pkg.get('groups', [])
        if groups and isinstance(groups[0], dict) and groups[0].get('name'):
            pilar = groups[0]['name']

        if pillar_filter and pillar_filter not in pilar.lower():
            continue

        org_name = pkg.get('organization', {}).get('title', 'BMKG') if pkg.get('organization') else 'BMKG'

        datasets_data.append({
            'id': pkg.get('id'),
            'name': pkg_name,
            'title': pkg.get('title'),
            'pilar': pilar,
            'organization': org_name,
            'notes': (pkg.get('notes') or '').strip()[:200],
            'license': pkg.get('license_title', 'CC-BY 4.0'),
            'csv_resource': {
                'id': csv_res.get('id'),
                'name': csv_res.get('name'),
                'format': csv_res.get('format', 'CSV'),
                'datastore_active': bool(csv_res.get('datastore_active')),
                'created': csv_res.get('created'),
                'last_modified': csv_res.get('last_modified') or csv_res.get('metadata_modified')
            },
            'endpoints': {
                'json': f"{base_url}/api/csv/{pkg_name}",
                'csv_stream': f"{base_url}/api/csv/{pkg_name}.csv",
                'raw': f"{base_url}/api/csv/{pkg_name}/raw",
                'schema': f"{base_url}/api/csv/{pkg_name}/schema"
            }
        })

    resp = jsonify({
        'success': True,
        'total_datasets': len(datasets_data),
        'filter': {'q': q, 'pillar': pillar_filter},
        'datasets': datasets_data
    })
    resp.headers['Cache-Control'] = 'public, max-age=60'
    return _with_cors(resp)


# ----------------------------------------------------------------------------
# 3. ENDPOINT DATASET CSV DINAMIS: GET /api/csv/<identifier>
# ----------------------------------------------------------------------------
@bmkg_api_blueprint.route('/api/csv/<path:identifier>', methods=['GET', 'OPTIONS'])
def get_csv_dataset_content(identifier):
    """
    Endpoint utama untuk mengakses isi dataset CSV:
    - /api/csv/<slug>            -> JSON data terformat
    - /api/csv/<slug>.csv        -> Stream berkas CSV murni (RFC 4180)
    - /api/csv/<slug>/raw        -> Stream berkas CSV murni
    - /api/csv/<slug>/schema     -> Skema dan statistik kolom data
    - /api/csv/resource/<res_id> -> Akses langsung via Resource UUID
    """
    if request.method == 'OPTIONS':
        return _with_cors(make_response('', 204))

    raw_ident = (identifier or '').strip()

    # Deteksi sub-tindakan: schema
    is_schema_req = False
    if raw_ident.endswith('/schema'):
        is_schema_req = True
        raw_ident = raw_ident[:-len('/schema')]

    # Deteksi sub-tindakan: raw csv
    is_raw_csv_req = False
    if raw_ident.endswith('/raw'):
        is_raw_csv_req = True
        raw_ident = raw_ident[:-len('/raw')]

    # Deteksi ekstensi .csv
    if raw_ident.lower().endswith('.csv'):
        is_raw_csv_req = True
        raw_ident = raw_ident[:-len('.csv')]

    # Resolusi Package & Resource
    pkg, res = _resolve_csv_dataset(raw_ident)
    if not pkg or not res:
        err_resp = jsonify({
            'success': False,
            'error': f"Dataset atau Resource CSV '{raw_ident}' tidak ditemukan pada Portal Data BMKG.",
            'hint': 'Gunakan GET /api/csv/datasets untuk melihat daftar dataset CSV yang tersedia.'
        })
        return _with_cors(err_resp), 404

    # Tangkap parameter permintaan
    req_format = request.args.get('format', '').lower().strip()
    if is_raw_csv_req or req_format == 'csv':
        output_format = 'csv'
    else:
        output_format = 'json'

    try:
        limit = int(request.args.get('limit', 100))
    except ValueError:
        limit = 100

    try:
        offset = int(request.args.get('offset', 0))
    except ValueError:
        offset = 0

    q_filter = request.args.get('q', '').strip()
    sort_param = request.args.get('sort', '').strip()
    is_download = request.args.get('download', '').lower() in ['1', 'true', 'yes']

    # Filter parameter kolom khusus (ekstrak param selain keyword standar)
    standard_params = {'limit', 'offset', 'q', 'sort', 'format', 'download', '_'}
    col_filters = {}
    for k, v in request.args.items():
        if k not in standard_params and v:
            col_filters[k] = v

    # Ambil baris data
    records, fieldnames, total_records, source_type, fields_meta = _fetch_csv_records(
        pkg, res, limit=limit, offset=offset, q=q_filter, sort=sort_param, col_filters=col_filters
    )

    base_url = request.host_url.rstrip('/')
    pkg_name = pkg.get('name', raw_ident)

    # ----------------------------------------------------
    # RESPON 1: SKEMA KOLOM & STATISTIK (/schema)
    # ----------------------------------------------------
    if is_schema_req:
        schema_summary = _compute_schema_summary(records, fields_meta)
        resp_data = {
            'success': True,
            'dataset_name': pkg_name,
            'dataset_title': pkg.get('title'),
            'resource_id': res.get('id'),
            'resource_name': res.get('name'),
            'source_type': source_type,
            'total_columns': len(schema_summary),
            'columns': schema_summary,
            'endpoint_data': f"{base_url}/api/csv/{pkg_name}"
        }
        resp = jsonify(resp_data)
        resp.headers['Cache-Control'] = 'public, max-age=60'
        return _with_cors(resp)

    # ----------------------------------------------------
    # RESPON 2: STREAM FORMAT CSV MURNI (.csv / format=csv)
    # ----------------------------------------------------
    if output_format == 'csv':
        output = io.StringIO()
        if fieldnames:
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore', lineterminator='\n')
            writer.writeheader()
            for r in records:
                writer.writerow(r)
        csv_string = output.getvalue()

        resp = Response(csv_string, mimetype='text/csv; charset=utf-8')
        filename = f"{pkg_name}.csv"
        disposition = 'attachment' if is_download else 'inline'
        resp.headers['Content-Disposition'] = f'{disposition}; filename="{filename}"'
        resp.headers['Cache-Control'] = 'public, max-age=30'
        return _with_cors(resp)

    # ----------------------------------------------------
    # RESPON 3: FORMAT JSON STANDAR
    # ----------------------------------------------------
    resp_payload = {
        'success': True,
        'meta': {
            'dataset_id': pkg.get('id'),
            'dataset_name': pkg_name,
            'dataset_title': pkg.get('title'),
            'resource_id': res.get('id'),
            'resource_name': res.get('name'),
            'source_engine': 'PostgreSQL DataStore' if source_type == 'datastore' else 'CKAN FileStore',
            'license': pkg.get('license_title', 'Creative Commons Attribution (CC-BY 4.0)'),
            'total_records': total_records,
            'returned_records': len(records),
            'limit': limit,
            'offset': offset,
            'filters_applied': {
                'q': q_filter or None,
                'sort': sort_param or None,
                'columns': col_filters or None
            },
            'fields': fieldnames,
            'endpoints': {
                'self_json': f"{base_url}/api/csv/{pkg_name}",
                'raw_csv': f"{base_url}/api/csv/{pkg_name}.csv",
                'schema': f"{base_url}/api/csv/{pkg_name}/schema",
                'docs': f"{base_url}/api/csv/docs"
            }
        },
        'data': records
    }
    resp = jsonify(resp_payload)
    resp.headers['Cache-Control'] = 'public, max-age=30'
    return _with_cors(resp)


# ============================================================================
# CKAN AUTOCOMPLETE ACTION & THEME PLUGIN
# ============================================================================

def custom_format_autocomplete(context, data_dict):
    q = (data_dict.get('q') or '').lower().strip()
    if q == '?':
        q = ''
    standard_formats = [
        'geojson', 'csv', 'json', 'kml', 'netcdf', 'shapefile', 'grib', 'bufr', 'pdf', 'xlsx', 'xml', 'wms'
    ]
    if not q:
        return standard_formats
    matched = [f for f in standard_formats if q in f]
    try:
        import ckan.model as model
        session = context.get('session') or model.Session
        query = session.query(model.Resource.format).filter(
            model.Resource.state == 'active',
            model.Resource.format.ilike(f'%{q}%')
        ).distinct()
        for r in query:
            fmt = (r.format or '').lower().strip()
            if fmt and fmt not in matched:
                matched.append(fmt)
    except Exception:
        pass
    return matched[:15]

class BMKGThemePlugin(plugins.SingletonPlugin):
    """
    Plugin kustomisasi tema visual Portal Data BMKG.
    Mengoverride template CKAN standar, menyematkan CSS khas BMKG,
    dan menyediakan helper untuk visualisasi katalog, 5 pilar MKG, serta REST API publik.
    """
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.ITemplateHelpers)
    plugins.implements(plugins.IBlueprint)
    plugins.implements(plugins.IActions)

    # IBlueprint
    def get_blueprint(self):
        return bmkg_api_blueprint

    # IActions
    def get_actions(self):
        return {
            'format_autocomplete': custom_format_autocomplete,
        }

    # IConfigurer
    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')

    # ITemplateHelpers
    def get_helpers(self):
        return {
            'bmkg_get_pilar_badge': self._get_pilar_badge,
            'bmkg_get_package_pilar': self._get_package_pilar,
            'bmkg_get_temporal_range': self._get_temporal_range,
            'bmkg_get_temporal_resolution': self._get_temporal_resolution,
            'bmkg_format_coordinates': self._format_coordinates,
            'bmkg_get_format_class': self._get_format_class,
            'bmkg_has_datastore': self._has_datastore,
            'bmkg_get_datastore_resource_id': self._get_datastore_resource_id,
            'bmkg_get_primary_resource': self._get_primary_resource,
            'bmkg_can_edit_package': self._can_edit_package,
            'bmkg_get_api_url': self._get_api_url,
            'bmkg_get_dataset_stats': self._get_dataset_stats,
            'bmkg_get_pillars': self._get_pillars,
            'bmkg_get_group_dataset_count': self._get_group_dataset_count,
            'bmkg_has_geojson': self._has_geojson,
            'bmkg_get_geojson_resource': self._get_geojson_resource,
            'bmkg_has_csv': self._has_csv,
            'bmkg_get_csv_resource': self._get_csv_resource,
            'bmkg_get_csv_api_url': self._get_csv_api_url,
            'bmkg_get_csv_download_url': self._get_csv_download_url,
        }

    def _get_pillar_meta(self, group):
        """Mengembalikan metadata visual pilar (icon, class, deskripsi bawaan, hitungan dataset)."""
        if isinstance(group, dict):
            name = (group.get('name') or '').lower().strip()
            title = (group.get('title') or group.get('display_name') or '').strip()
            desc = (group.get('description') or '').strip()
            pkg_count = group.get('package_count')
        else:
            name = str(group).lower().strip()
            title = ''
            desc = ''
            pkg_count = None

        if not title:
            title = name.replace('-', ' ').title()

        if pkg_count is None:
            pkg_count = self._get_group_dataset_count(name)

        presets = {
            'meteorologi': {
                'class': 'meteorologi',
                'border_color': 'var(--bmkg-blue)',
                'icon_svg': '<svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8a5 5 0 0 1 5 5v.5a4.5 4.5 0 1 1 2 8.5H10A6 6 0 0 1 12 8z" fill="rgba(0, 90, 158, 0.15)" /><path d="M10 24v3M15 24v3M20 24v3" /></svg>',
                'icon_class': 'fa-solid fa-cloud-sun',
                'short_name': 'Meteorologi',
                'default_desc': 'Data pengamatan cuaca permukaan, prakiraan gelombang laut maritim, cuaca penerbangan, dan data radar cuaca komposit.'
            },
            'klimatologi': {
                'class': 'klimatologi',
                'border_color': 'var(--alert-amber)',
                'icon_svg': '<svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#047857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="5" fill="#10b981" stroke="#047857" /><line x1="11" y1="2" x2="11" y2="4" /><line x1="11" y1="18" x2="11" y2="20" /><line x1="2" y1="11" x2="4" y2="11" /><line x1="18" y1="11" x2="20" y2="11" /><path d="M23 15a2 2 0 0 0-2-2v-5a2 2 0 1 1 4 0v5a2 2 0 0 0-2 2z" fill="#d1fae5" /><circle cx="23" cy="22" r="3" fill="#047857" /><line x1="23" y1="12" x2="23" y2="22" stroke="#047857" stroke-width="2.5" /></svg>',
                'icon_class': 'fa-solid fa-temperature-half',
                'short_name': 'Iklim',
                'default_desc': 'Deret waktu iklim historis, pemantauan anomali iklim, data curah hujan dasarian dan bulanan, serta indeks kekeringan (SPI).'
            },
            'geofisika': {
                'class': 'geofisika',
                'border_color': 'var(--seismic-red)',
                'icon_svg': '<svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#c92a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="13" stroke="#c92a2a" stroke-width="1.8" opacity="0.35" fill="rgba(201, 42, 42, 0.08)" /><path d="M4 16h5l2.5-7 4 14 3.5-10 2.5 5 2-2h6.5" stroke="#c92a2a" stroke-width="2.2" /></svg>',
                'icon_class': 'fa-solid fa-volcano',
                'short_name': 'Gempa',
                'default_desc': 'Katalog parameter gempa bumi tektonik M ≥ 5.0, pemodelan penjalaran tsunami, kerapatan sambaran petir, dan geomagnetisme.'
            },
            'kualitas-udara': {
                'class': 'kualitas-udara',
                'border_color': 'var(--bmkg-green)',
                'icon_svg': '<i class="fa-solid fa-wind" style="font-size: 1.35rem; color: #059669;"></i>',
                'icon_class': 'fa-solid fa-wind',
                'short_name': 'Kualitas Udara',
                'default_desc': 'Pemantauan konsentrasi partikulat atmosfer PM2.5 & PM10, kimia air hujan, dan gas rumah kaca (GRK).'
            },
            'kualitas_udara': {
                'class': 'kualitas-udara',
                'border_color': 'var(--bmkg-green)',
                'icon_svg': '<i class="fa-solid fa-wind" style="font-size: 1.35rem; color: #059669;"></i>',
                'icon_class': 'fa-solid fa-wind',
                'short_name': 'Kualitas Udara',
                'default_desc': 'Pemantauan konsentrasi partikulat atmosfer PM2.5 & PM10, kimia air hujan, dan gas rumah kaca (GRK).'
            },
            'instrumen-mkg': {
                'class': 'instrumen-mkg',
                'border_color': 'var(--bmkg-green)',
                'icon_svg': '<i class="fa-solid fa-gauge-high" style="font-size: 1.25rem; color: #00875a;"></i>',
                'icon_class': 'fa-solid fa-gauge-high',
                'short_name': 'Instrumen MKG',
                'default_desc': 'Metadata kalibrasi teknis instrumen observasi, jaringan sensor otomatis (AWS, AAWS, ARG), radar, dan seismometer.'
            },
            'modifikasi-cuaca': {
                'class': 'modifikasi-cuaca',
                'border_color': '#7c3aed',
                'icon_svg': '<i class="fa-solid fa-cloud-sun-rain" style="font-size: 1.25rem; color: #7c3aed;"></i>',
                'icon_class': 'fa-solid fa-cloud-sun-rain',
                'short_name': 'Modifikasi Cuaca',
                'default_desc': 'Data operasional Teknologi Modifikasi Cuaca (TMC), penyemaian awan, mitigasi bencana kekeringan, dan pengisian waduk.'
            }
        }

        preset = presets.get(name, {
            'class': name,
            'border_color': '#0284c7',
            'icon_svg': '<i class="fa-solid fa-layer-group" style="font-size: 1.25rem; color: #0284c7;"></i>',
            'icon_class': 'fa-solid fa-layer-group',
            'short_name': title,
            'default_desc': 'Koleksi dataset terbuka institusi BMKG dalam kategori pilar tematik terkait.'
        })

        return {
            'id': group.get('id') if isinstance(group, dict) else '',
            'name': name,
            'title': title,
            'short_name': preset.get('short_name', title),
            'description': desc or preset['default_desc'],
            'package_count': pkg_count,
            'class': preset['class'],
            'border_color': preset['border_color'],
            'icon_svg': preset['icon_svg'],
            'icon_class': preset['icon_class']
        }

    def _get_pillars(self):
        """Mengambil seluruh daftar pilar (grup) aktif dari CKAN."""
        try:
            group_list = toolkit.get_action('group_list')(
                {'ignore_auth': True}, {'all_fields': True}
            )
            order_priority = {
                'meteorologi': 1,
                'klimatologi': 2,
                'geofisika': 3,
                'kualitas-udara': 4,
                'kualitas_udara': 4,
                'instrumen-mkg': 5,
                'modifikasi-cuaca': 6
            }
            def sort_key(g):
                name = (g.get('name') or '').lower()
                return (order_priority.get(name, 99), g.get('title') or name)

            sorted_groups = sorted(group_list, key=sort_key)
            return [self._get_pillar_meta(g) for g in sorted_groups]
        except Exception:
            defaults = ['meteorologi', 'klimatologi', 'geofisika', 'kualitas-udara']
            return [self._get_pillar_meta(d) for d in defaults]

    def _get_dataset_stats(self):
        """Return real portal statistics from the CKAN database."""
        try:
            result = toolkit.get_action('package_search')(
                {'ignore_auth': True}, {'q': '*:*', 'rows': 0}
            )
            total = result.get('count', 0)
        except Exception:
            total = 0

        try:
            org_list = toolkit.get_action('organization_list')(
                {'ignore_auth': True}, {'all_fields': False}
            )
            org_count = len(org_list)
        except Exception:
            org_count = 0

        pillars = self._get_pillars()
        total_pillars = len(pillars)
        short_names = [p['short_name'] for p in pillars if p.get('short_name')]
        pillars_summary = ", ".join(short_names) if short_names else "Meteorologi, Iklim, Gempa, Kualitas Udara"

        return {
            'total_datasets': total,
            'total_orgs': org_count,
            'total_pillars': total_pillars,
            'pillars': pillars,
            'pillar_names': short_names,
            'pillars_summary': pillars_summary,
        }

    def _get_group_dataset_count(self, group_name):
        """Return the number of datasets in a specific CKAN group (pilar)."""
        try:
            result = toolkit.get_action('group_show')(
                {'ignore_auth': True},
                {'id': group_name, 'include_dataset_count': True}
            )
            return result.get('package_count', 0)
        except Exception:
            return 0

    def _can_edit_package(self, package):
        if not package:
            return False
        try:
            pkg_id = package.get('id') if isinstance(package, dict) else getattr(package, 'id', None)
            if not pkg_id:
                return False
            return toolkit.check_access('package_update', {'id': pkg_id})
        except Exception:
            return False

    def _get_datastore_resource_id(self, package):
        resources = package.get('resources', []) if isinstance(package, dict) else getattr(package, 'resources', [])
        for r in resources:
            if isinstance(r, dict) and r.get('datastore_active'):
                return r.get('id')
            elif hasattr(r, 'datastore_active') and r.datastore_active:
                return getattr(r, 'id', None)
        return None

    def _has_csv(self, package):
        return _find_csv_resource_in_package(package) is not None

    def _get_csv_resource(self, package):
        return _find_csv_resource_in_package(package)

    def _get_csv_api_url(self, package):
        pkg_name = package.get('name') if isinstance(package, dict) else getattr(package, 'name', '')
        return f"/api/csv/{pkg_name}"

    def _get_csv_download_url(self, package):
        pkg_name = package.get('name') if isinstance(package, dict) else getattr(package, 'name', '')
        return f"/api/csv/{pkg_name}.csv"

    def _get_api_url(self, package):
        # Jika dataset memiliki CSV, arahkan ke endpoint CSV publik
        if self._has_csv(package):
            pkg_name = package.get('name') if isinstance(package, dict) else getattr(package, 'name', '')
            return f"/api/csv/{pkg_name}"

        ds_id = self._get_datastore_resource_id(package)
        if ds_id:
            return f"/api/3/action/datastore_search?resource_id={ds_id}&limit=5"
        pkg_name = package.get('name') if isinstance(package, dict) else getattr(package, 'name', '')
        return f"/api/3/action/package_show?id={pkg_name}"

    def _get_package_pilar(self, package):
        if not package:
            return 'meteorologi'
        groups = package.get('groups', []) if isinstance(package, dict) else getattr(package, 'groups', [])
        if groups:
            first_g = groups[0]
            if isinstance(first_g, dict) and first_g.get('name'):
                return first_g['name']
            elif hasattr(first_g, 'name') and first_g.name:
                return first_g.name
        # Fallback to extras
        extras = package.get('extras', []) if isinstance(package, dict) else getattr(package, 'extras', [])
        if isinstance(extras, dict):
            return extras.get('pilar_mkg', 'meteorologi')
        elif isinstance(extras, list):
            for ex in extras:
                if isinstance(ex, dict) and ex.get('key') == 'pilar_mkg':
                    return ex.get('value', 'meteorologi')
                elif hasattr(ex, 'key') and ex.key == 'pilar_mkg':
                    return ex.value
        return 'meteorologi'

    def _get_temporal_range(self, package):
        if not package:
            return None
        extras = package.get('extras', []) if isinstance(package, dict) else getattr(package, 'extras', [])
        if isinstance(extras, dict):
            return extras.get('cakupan_temporal')
        elif isinstance(extras, list):
            for ex in extras:
                if isinstance(ex, dict) and ex.get('key') == 'cakupan_temporal':
                    return ex.get('value')
                elif hasattr(ex, 'key') and ex.key == 'cakupan_temporal':
                    return ex.value
        return None

    def _get_temporal_resolution(self, package):
        if not package:
            return None
        extras = package.get('extras', []) if isinstance(package, dict) else getattr(package, 'extras', [])
        if isinstance(extras, dict):
            return extras.get('resolusi_temporal')
        elif isinstance(extras, list):
            for ex in extras:
                if isinstance(ex, dict) and ex.get('key') == 'resolusi_temporal':
                    return ex.get('value')
                elif hasattr(ex, 'key') and ex.key == 'resolusi_temporal':
                    return ex.value
        return None

    def _get_pilar_badge(self, pilar_code):
        badges = {
            'meteorologi': {'label': 'Meteorologi', 'class': 'met', 'icon': 'fa-solid fa-cloud-sun'},
            'klimatologi': {'label': 'Klimatologi', 'class': 'klim', 'icon': 'fa-solid fa-temperature-half'},
            'geofisika': {'label': 'Geofisika', 'class': 'geo', 'icon': 'fa-solid fa-volcano'},
            'kualitas-udara': {'label': 'Kualitas Udara', 'class': 'ku', 'icon': 'fa-solid fa-wind'},
            'kualitas_udara': {'label': 'Kualitas Udara', 'class': 'ku', 'icon': 'fa-solid fa-wind'},
            'instrumen-mkg': {'label': 'Instrumen MKG', 'class': 'ku', 'icon': 'fa-solid fa-gauge-high'},
            'modifikasi-cuaca': {'label': 'Modifikasi Cuaca', 'class': 'mc', 'icon': 'fa-solid fa-cloud-sun-rain'},
        }
        if pilar_code in badges:
            return badges[pilar_code]
        label = str(pilar_code or 'Umum').replace('-', ' ').title()
        return {'label': label, 'class': 'met', 'icon': 'fa-solid fa-layer-group'}

    def _get_format_class(self, format_name):
        fmt = (format_name or '').lower().strip()
        if 'csv' in fmt:
            return 'csv'
        elif 'geojson' in fmt:
            return 'geojson'
        elif 'kml' in fmt:
            return 'kml'
        elif 'netcdf' in fmt or 'nc' in fmt:
            return 'netcdf'
        elif 'json' in fmt:
            return 'json'
        elif 'pdf' in fmt:
            return 'pdf'
        return 'csv'

    def _has_datastore(self, package):
        resources = package.get('resources', []) if isinstance(package, dict) else getattr(package, 'resources', [])
        for r in resources:
            if isinstance(r, dict) and r.get('datastore_active'):
                return True
            elif hasattr(r, 'datastore_active') and r.datastore_active:
                return True
        return False

    def _get_primary_resource(self, package):
        resources = package.get('resources', []) if isinstance(package, dict) else getattr(package, 'resources', [])
        if resources:
            return resources[0]
        return None

    def _format_coordinates(self, lat, lon):
        if lat is not None and lon is not None:
            return f"{lat:.4f}, {lon:.4f}"
        return "-"

    def _has_geojson(self, package):
        resources = package.get('resources', []) if isinstance(package, dict) else getattr(package, 'resources', [])
        for r in resources:
            fmt = (r.get('format', '') if isinstance(r, dict) else getattr(r, 'format', '')).lower()
            url = (r.get('url', '') if isinstance(r, dict) else getattr(r, 'url', '')).lower()
            name = (r.get('name', '') if isinstance(r, dict) else getattr(r, 'name', '')).lower()
            if 'geojson' in fmt or 'geojson' in url or 'geojson' in name or url.endswith('.geojson'):
                return True
        return False

    def _get_geojson_resource(self, package):
        resources = package.get('resources', []) if isinstance(package, dict) else getattr(package, 'resources', [])
        for r in resources:
            fmt = (r.get('format', '') if isinstance(r, dict) else getattr(r, 'format', '')).lower()
            url = (r.get('url', '') if isinstance(r, dict) else getattr(r, 'url', '')).lower()
            name = (r.get('name', '') if isinstance(r, dict) else getattr(r, 'name', '')).lower()
            if 'geojson' in fmt or 'geojson' in url or 'geojson' in name or url.endswith('.geojson'):
                return r
        return None


class BMKGSchemaPlugin(plugins.SingletonPlugin):
    """
    Plugin skema metadata khusus BMKG untuk 5 Pilar Data.
    Memvalidasi dan menambahkan custom facets: Pilar MKG, Format, Organisasi, dsb.
    """
    plugins.implements(plugins.IPackageController, inherit=True)
    plugins.implements(plugins.IFacets)

    # IFacets: Konfigurasi facet filter di sidebar pencarian katalog
    def dataset_facets(self, facets_dict, package_type):
        ordered_facets = {}
        ordered_facets['groups'] = toolkit._('Pilar Layanan MKG')
        ordered_facets['res_format'] = toolkit._('Format Berkas')
        ordered_facets['organization'] = toolkit._('Unit Kerja / Organisasi')
        ordered_facets['pilar_mkg'] = toolkit._('Pilar Metadata')
        ordered_facets['resolusi_temporal'] = toolkit._('Resolusi Waktu')
        return ordered_facets

    def group_facets(self, facets_dict, group_type, package_type):
        return facets_dict

    def organization_facets(self, facets_dict, organization_type, package_type):
        return facets_dict
