from ckan.config.middleware import make_app
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)
from ckan import model
admin = model.User.by_name('admin_bmkg')
print("Name:", admin.name, "sysadmin:", admin.sysadmin)
