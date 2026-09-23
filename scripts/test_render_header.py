from ckan.config.middleware import make_app
from ckan.cli import load_config
from ckan.common import c
from ckan import model
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)
from ckan.lib.base import render_snippet

with app.test_request_context('/'):
    user = model.User.by_name('admin_bmkg')
    c.userobj = user
    c.user = user.name
    try:
        output = render_snippet('header.html')
        print("SUCCESS RENDERING SNIPPET:")
        for line in output.splitlines():
            if 'ADMIN' in line or 'header-user-badge' in line or 'dashboard_url' in line:
                print(line)
    except Exception as e:
        print("RENDER ERROR:", e)
