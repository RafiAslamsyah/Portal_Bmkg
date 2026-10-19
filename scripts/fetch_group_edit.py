import requests
import re

# 1. Get login page
resp = requests.get('http://localhost:5000/user/login')
m = re.search(r'name="_csrf_token"\s+value="([^"]+)"', resp.text)
csrf = m.group(1) if m else ''
print("CSRF:", csrf)
init_cookie = resp.headers.get('Set-Cookie', '')
print("Init Set-Cookie:", init_cookie[:80])

ckan_init = ''
if 'ckan=' in init_cookie:
    ckan_init = init_cookie.split('ckan=')[1].split(';')[0]

headers = {
    'Cookie': f'ckan={ckan_init}'
}

# 2. Login as admin
login_data = {
    'login': 'admin',
    'password': 'AdminBMKG2026!',
    '_csrf_token': csrf,
    'save': ''
}
post_resp = requests.post('http://localhost:5000/user/login', data=login_data, headers=headers, allow_redirects=False)
raw_cookie = post_resp.headers.get('Set-Cookie', '')
print("Login status code:", post_resp.status_code)
print("Login Set-Cookie:", raw_cookie[:80])

if 'ckan=' in raw_cookie:
    ckan_auth = raw_cookie.split('ckan=')[1].split(';')[0]
    auth_headers = {'Cookie': f'ckan={ckan_auth}'}
    edit_resp = requests.get('http://localhost:5000/group/edit/meteorologi', headers=auth_headers)
    print("Group edit status code:", edit_resp.status_code)
    print("Edit HTML length:", len(edit_resp.text))
    with open('scripts/group_edit_rendered.html', 'w', encoding='utf-8') as f:
        f.write(edit_resp.text)
    print("Saved HTML to scripts/group_edit_rendered.html")
