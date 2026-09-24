import sys
from ckan.config.middleware import make_app
from ckan.cli import load_config
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)
client = app.test_client()

routes = [
    '/',
    '/dataset',
    '/dataset/',
    '/dataset?q=gempa',
    '/dataset?organization=stasiun-geofisika-klas-i-tangerang',
    '/dataset?res_format=CSV',
    '/dataset/gempa-bumi-m5-realtime',
    '/organization',
    '/group',
]

for r in routes:
    try:
        res = client.get(r, follow_redirects=True)
        print(f"{r} -> {res.status_code}")
        if res.status_code >= 400:
            print(f"--- ERROR BODY FOR {r} ---")
            print(res.data.decode('utf-8', errors='ignore')[:1000])
    except Exception as e:
        print(f"EXCEPTION ON {r}: {e}")
        import traceback
        traceback.print_exc()
