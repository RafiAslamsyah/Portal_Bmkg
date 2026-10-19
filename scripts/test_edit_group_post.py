import requests
import re

session = requests.Session()

# 1. Login
resp = requests.get('http://localhost:5000/user/login')
m = re.search(r'name="_csrf_token"\s+value="([^"]+)"', resp.text)
csrf = m.group(1) if m else ''
init_cookie = resp.headers.get('Set-Cookie', '').split('ckan=')[1].split(';')[0]
headers = {'Cookie': f'ckan={init_cookie}'}

login_data = {'login': 'admin', 'password': 'AdminBMKG2026!', '_csrf_token': csrf, 'save': ''}
post_resp = requests.post('http://localhost:5000/user/login', data=login_data, headers=headers, allow_redirects=False)
auth_cookie = post_resp.headers.get('Set-Cookie', '').split('ckan=')[1].split(';')[0]
auth_headers = {'Cookie': f'ckan={auth_cookie}'}

# 2. GET current group edit page to get fresh CSRF
edit_page = requests.get('http://localhost:5000/group/edit/meteorologi', headers=auth_headers)
m2 = re.search(r'name="_csrf_token"\s+value="([^"]+)"', edit_page.text)
csrf2 = m2.group(1) if m2 else ''
print("Group Edit CSRF:", csrf2)

# 3. POST save with updated description
post_data = {
    '_csrf_token': csrf2,
    'name': 'meteorologi',
    'title': 'Meteorologi',
    'description': 'Pilar observasi, prediksi cuaca permukaan, angin maritim, radar, citra satelit resolusi tinggi, dan layanan informasi cuaca penerbangan di seluruh wilayah Indonesia.',
    'image_url': '/img/pilar-met.png',
    'extras__0__key': 'penanggung_jawab',
    'extras__0__value': 'Kedeputian Bidang Meteorologi',
    'extras__1__key': 'email_kontak',
    'extras__1__value': 'info.cuaca@bmkg.go.id',
    'extras__2__key': 'kategori_tematik',
    'extras__2__value': 'Pilar Utama',
    'save': ''
}

save_resp = requests.post('http://localhost:5000/group/edit/meteorologi', data=post_data, headers=auth_headers, allow_redirects=False)
print("Save Response Status:", save_resp.status_code)
print("Save Redirect Location:", save_resp.headers.get('Location'))

# 4. Verify group detail via API
group_api = requests.get('http://localhost:5000/api/3/action/group_show?id=meteorologi').json()
if group_api.get('success'):
    res = group_api['result']
    print("API Verified Title:", res.get('title'))
    print("API Verified Image URL:", res.get('image_url'))
    print("API Verified Description:", res.get('description')[:60] + '...')
    print("API Verified Extras:", res.get('extras'))
else:
    print("API Error:", group_api)
