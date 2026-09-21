# encoding: utf-8
import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit

class BMKGThemePlugin(plugins.SingletonPlugin):
    """
    Plugin kustomisasi tema visual Portal Data BMKG.
    Mengoverride template CKAN standar, menyematkan CSS khas BMKG,
    dan menyediakan helper untuk visualisasi katalog dan 4 pilar MKG.
    """
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.ITemplateHelpers)

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
            'bmkg_get_primary_resource': self._get_primary_resource,
        }

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
