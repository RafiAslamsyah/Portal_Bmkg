import os
os.environ['CKAN_INI'] = '/etc/ckan/default/ckan.ini'
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')
import ckan.model as model
import sqlalchemy as sa

engine = sa.create_engine(conf.get('sqlalchemy.url'))
model.init_model(engine)

user = model.User.by_name('admin')
if user:
    user._set_password('AdminBMKG2026!')
    user.sysadmin = True
    model.repo.commit()
    print("SUCCESS: Admin password set to AdminBMKG2026! and sysadmin enabled.")
else:
    print("User admin not found.")

