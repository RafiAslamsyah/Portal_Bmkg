# encoding: utf-8
import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit

class BMKGThemePlugin(plugins.SingletonPlugin):
    """
    Plugin kustomisasi tema visual Portal Data BMKG.
    Mengoverride template CKAN standar, menyematkan CSS khas BMKG,
    dan menyediakan helper untuk visualisasi statistik 4 pilar MKG.
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
            'bmkg_format_coordinates': self._format_coordinates,
        }

    def _get_pilar_badge(self, pilar_code):
        badges = {
            'meteorologi': {'label': 'Meteorologi / Cuaca', 'color': 'badge-sky'},
            'klimatologi': {'label': 'Klimatologi / Iklim', 'color': 'badge-amber'},
            'geofisika': {'label': 'Geofisika / Gempa & Tsunami', 'color': 'badge-rose'},
            'kualitas_udara': {'label': 'Kualitas Udara / Atmosfer', 'color': 'badge-emerald'},
        }
        return badges.get(pilar_code, {'label': 'Umum', 'color': 'badge-gray'})

    def _format_coordinates(self, lat, lon):
        if lat is not None and lon is not None:
            return f"{lat:.4f}, {lon:.4f}"
        return "-"


class BMKGSchemaPlugin(plugins.SingletonPlugin):
    """
    Plugin skema metadata khusus BMKG untuk 4 Pilar Data.
    Memvalidasi dan menambahkan custom fields: ID Stasiun WMO, tipe sensor, dsb.
    """
    plugins.implements(plugins.IPackageController, inherit=True)
    plugins.implements(plugins.IFacets)

    # IFacets: Tambahkan facet pilar_mkg ke sidebar pencarian
    def dataset_facets(self, facets_dict, package_type):
        facets_dict['pilar_mkg'] = toolkit._('Pilar BMKG')
        facets_dict['cakupan_spasial'] = toolkit._('Cakupan Wilayah')
        facets_dict['resolusi_temporal'] = toolkit._('Resolusi Waktu')
        return facets_dict

    def group_facets(self, facets_dict, group_type, package_type):
        return facets_dict

    def organization_facets(self, facets_dict, organization_type, package_type):
        return facets_dict
