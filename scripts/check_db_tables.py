import os
import sys

os.environ['CKAN_INI'] = '/etc/ckan/default/ckan.ini'
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')

import ckan.model as model
import sqlalchemy as sa

db_url = conf.get('sqlalchemy.url')
print("Connecting to DB:", db_url)
engine = sa.create_engine(db_url)
model.init_model(engine)

insp = sa.inspect(engine)
existing_tables = set(insp.get_table_names())
model_tables = set(model.meta.metadata.tables.keys())

print("Existing tables in DB:", len(existing_tables))
print("Expected tables in Model:", len(model_tables))

missing = model_tables - existing_tables
print("\nMissing tables:", missing)

if missing:
    print("\nCreating missing tables via metadata.create_all(engine)...")
    model.meta.metadata.create_all(engine)
    print("create_all completed!")
    new_existing = set(sa.inspect(engine).get_table_names())
    still_missing = model_tables - new_existing
    print("Still missing:", still_missing)
else:
    print("All model tables exist!")

