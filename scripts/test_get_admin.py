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
ckan_cookie = re.search(r'ckan=([^;]+)', set_cookie)
headers = {'Cookie': f"ckan={ckan_cookie.group(1)}"} if ckan_cookie else {}

r_admin = s.get('http://127.0.0.1:5000/ckan-admin/', headers=headers)
print("/ckan-admin/ status:", r_admin.status_code)
r_config = s.get('http://127.0.0.1:5000/ckan-admin/config', headers=headers)
print("/ckan-admin/config status:", r_config.status_code)
r_trash = s.get('http://127.0.0.1:5000/ckan-admin/trash', headers=headers)
print("/ckan-admin/trash status:", r_trash.status_code)

found = []
for kw in ['admin-hero', 'admin-nav-tabs', 'bmkg-admin-table', 'badge-role-sysadmin', 'btn-revoke-sysadmin', 'btn-promote-submit']:
    if kw in r_admin.text:
        found.append(kw)
print("Found elements:", found)
