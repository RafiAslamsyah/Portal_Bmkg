import requests
import re

s = requests.Session()
r = s.get('http://127.0.0.1:5000/user/login')
csrf_match = re.search(r'name="_csrf_token"\s+value="([^"]+)"', r.text)
csrf = csrf_match.group(1) if csrf_match else ''

res = s.post('http://127.0.0.1:5000/user/login', data={
    'login': 'admin_bmkg',
    'password': 'AdminBMKG2026!',
    '_csrf_token': csrf
}, allow_redirects=False)

set_cookie = res.headers.get('Set-Cookie', '')
print("Set-Cookie:", set_cookie[:80])
ckan_cookie = re.search(r'ckan=([^;]+)', set_cookie)
headers = {'Cookie': f"ckan={ckan_cookie.group(1)}"} if ckan_cookie else {}

r_new = s.get('http://127.0.0.1:5000/dataset/new', headers=headers)
print("/dataset/new status:", r_new.status_code)
with open('/tmp/dataset_new.html', 'w', encoding='utf-8') as f:
    f.write(r_new.text)
print("Saved /tmp/dataset_new.html, bytes:", len(r_new.text))
