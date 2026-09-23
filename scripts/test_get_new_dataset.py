from ckan.config.middleware import make_app
from ckan.cli import load_config
from ckan import model
conf = load_config('/etc/ckan/default/ckan.ini')
app = make_app(conf)

with app.test_client() as client:
    res = client.get('/dataset/new', environ_base={'REMOTE_USER': 'admin_bmkg'})
    print("Status code:", res.status_code)
    html = res.data.decode('utf-8', errors='ignore')
    # print relevant form parts
    lines = html.splitlines()
    print(f"Total lines: {len(lines)}")
    # save full html to a debug file
    with open('/tmp/new_dataset.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Saved to /tmp/new_dataset.html")
