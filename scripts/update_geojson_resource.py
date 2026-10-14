from ckan.config.middleware import make_app
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)
import ckan.plugins.toolkit as toolkit
import ckan.model as model

pkg = model.Package.get('katalog-gempa-m5')
if pkg and pkg.resources:
    res = pkg.resources[0]
    print(f"Current url: {res.url}")
    res.url = '/data/gempa_tektonik_m5_indonesia.geojson'
    model.Session.add(res)
    model.Session.commit()
    print(f"Updated url to: {res.url}")
else:
    print("Package not found")
