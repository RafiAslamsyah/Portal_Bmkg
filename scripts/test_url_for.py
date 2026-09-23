import os
from ckan.config.middleware import make_app
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)
from ckan.lib.helpers import url_for
with app.test_request_context():
    try:
        print('admin.index ->', url_for('admin.index'))
    except Exception as e:
        print('admin.index error:', e)
    try:
        print('dashboard.datasets ->', url_for('dashboard.datasets'))
    except Exception as e:
        print('dashboard.datasets error:', e)
