from ckan.config.middleware import make_app
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)
import ckan.plugins.toolkit as toolkit

site_user = toolkit.get_action('get_site_user')({'ignore_auth': True})
context = {'user': site_user['name'], 'ignore_auth': True}

pkg = toolkit.get_action('package_show')(context, {'id': 'katalog-gempa-m5'})
for res in pkg.get('resources', []):
    print("Patching resource:", res['id'], "old url:", res['url'])
    toolkit.get_action('resource_patch')(context, {
        'id': res['id'],
        'url': 'http://localhost:5000/data/gempa_tektonik_m5_indonesia.geojson'
    })
    print("New url set to http://localhost:5000/data/gempa_tektonik_m5_indonesia.geojson")
