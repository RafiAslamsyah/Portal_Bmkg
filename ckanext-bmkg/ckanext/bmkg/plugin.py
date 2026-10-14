# encoding: utf-8
import time
import urllib.request
import json
import re
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit

bmkg_api_blueprint = Blueprint('bmkg_api', __name__)

_CACHED_GEMPA = []
_LAST_GEMPA_FETCH = 0
_GEMPA_CACHE_TTL = 30  # 30 detik cache in-memory

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

@bmkg_api_blueprint.route('/api/gempa/realtime')
def get_bmkg_gempa_realtime():
    events = _fetch_bmkg_realtime_events()
    resp = jsonify(events)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Cache-Control'] = 'public, max-age=15'
    return resp

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
    dan menyediakan helper untuk visualisasi katalog dan 4 pilar MKG.
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
            'bmkg_get_group_dataset_count': self._get_group_dataset_count,
            'bmkg_has_geojson': self._has_geojson,
            'bmkg_get_geojson_resource': self._get_geojson_resource,
        }

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

        return {
            'total_datasets': total,
            'total_orgs': org_count,
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

            user_obj = getattr(toolkit.g, 'userobj', None) or getattr(toolkit.c, 'userobj', None)
            user_name = getattr(toolkit.g, 'user', None) or getattr(toolkit.c, 'user', None)
            if not user_name and user_obj:
                user_name = getattr(user_obj, 'name', None)

            if not user_name and not user_obj:
                return False

            if user_obj and getattr(user_obj, 'sysadmin', False):
                return True

            context = {
                'model': toolkit.model,
                'session': toolkit.model.Session,
                'user': user_name,
                'auth_user_obj': user_obj
            }
            toolkit.check_access('package_update', context, {'id': pkg_id})
            return True
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

    def _get_api_url(self, package):
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
        }
        return badges.get(pilar_code, {'label': 'Umum / MKG', 'class': 'met', 'icon': 'fa-solid fa-database'})

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
    Plugin skema metadata khusus BMKG untuk 4 Pilar Data.
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
