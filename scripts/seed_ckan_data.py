import os
import sys
import json
import requests

API_URL = "http://127.0.0.1:8080/api/3/action"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJyekRuTDJ5RzZRSW5reFJNdl9UZTFVaFNMaTNjd1Btd0FlU1ljUUszdzlvIiwiaWF0IjoxNzg5OTYwNDE0fQ.txgcZYYGXfiAWJsJBKGt5srFJkMKmD6zFdy1HX4Vz4c"
# Konfigurasi Endpoint API CKAN (Default Port 5000, dapat di-override lewat env)
API_PORT = os.environ.get("CKAN_PORT", "5000")
API_URL = os.environ.get("CKAN_API_URL", f"http://127.0.0.1:{API_PORT}/api/3/action")

# Token API CKAN dari Environment Variable (mencegah credential hardcoded di Git)
TOKEN = os.environ.get("CKAN_API_TOKEN") or os.environ.get("CKAN_TOKEN", "")

HEADERS = {
    "Authorization": TOKEN,
    "Content-Type": "application/json"
}
if TOKEN:
    HEADERS["Authorization"] = TOKEN

# Path direktori proyek dinamis (independen dari sistem operasi / username pengguna)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def post_action(action, data=None):
    url = f"{API_URL}/{action}"
    if data:
        r = requests.post(url, headers=HEADERS, json=data)
    else:
        r = requests.post(url, headers=HEADERS)
    return r.json()

def main():
    print("Testing connection to CKAN API...")
    status = requests.get(f"{API_URL}/status_show").json()
    print("CKAN Status:", status.get('success'))
    print("Testing connection to CKAN API at:", API_URL)
    if not TOKEN:
        print("[WARN] Environment variable CKAN_API_TOKEN belum disetel!")
        print("       Setel terlebih dahulu dengan: export CKAN_API_TOKEN='<token_jwt_ckan>'")
        print("       Atau jalankan: CKAN_API_TOKEN='<token>' python scripts/seed_ckan_data.py")

    try:
        status = requests.get(f"{API_URL}/status_show", timeout=5).json()
        print("CKAN Status:", status.get('success'))
    except Exception as e:
        print(f"[ERROR] Gagal terhubung ke CKAN di {API_URL}: {e}")
        return

    # 1. Create 4 Pilar MKG Groups
    pilars = [
        {'name': 'meteorologi', 'title': 'Meteorologi', 'description': 'Data pengamatan dan prediksi meteorologi serta cuaca BMKG'},
        {'name': 'klimatologi', 'title': 'Klimatologi', 'description': 'Data pengamatan iklim, curah hujan, dan variabilitas iklim BMKG'},
        {'name': 'geofisika', 'title': 'Geofisika', 'description': 'Data kegempaan, seismik, tsunami, dan magnet bumi BMKG'},
        {'name': 'kualitas-udara', 'title': 'Kualitas Udara', 'description': 'Data pengamatan konsentrasi partikulat dan kualitas udara atmosfer BMKG'}
    ]

    for p in pilars:
        res = post_action('group_create', p)
        if res.get('success'):
            print(f"[OK] Group created: {p['name']}")
        else:
            err = res.get('error', {}).get('message', res.get('error'))
            print(f"[INFO] Group {p['name']}: {err}")

    # 2. Create Organizations
    orgs = [
        {
            'name': 'bbmkg-wilayah-2',
            'title': 'BBMKG Wilayah II (Jawa)',
            'description': 'Balai Besar Meteorologi Klimatologi dan Geofisika Wilayah II - Ciputat, Tangerang Selatan'
        },
        {
            'name': 'kedeputian-teknis-pusat',
            'title': 'Kedeputian Teknis Pusat BMKG',
            'description': 'Kedeputian Bidang Meteorologi, Klimatologi, dan Geofisika Pusat BMKG Jakarta'
        }
    ]

    for o in orgs:
        res = post_action('organization_create', o)
        if res.get('success'):
            print(f"[OK] Org created: {o['name']}")
        else:
            err = res.get('error', {}).get('message', res.get('error'))
            print(f"[INFO] Org {o['name']}: {err}")

    # 3. Create Dataset (Single Dataset for Presentation)
    dataset_name = 'cuaca-harian-soekarno-hatta-2026'
    pkg_payload = {
        'name': dataset_name,
        'title': 'Data Observasi Cuaca Harian Permukaan Stasiun Soekarno-Hatta (WMO: 96749) Tahun 2026',
        'notes': 'Dataset time-series rekaman harian parameter atmosfer permukaan meliputi suhu minimum, suhu maksimum, suhu rata-rata, kelembapan nisbi udara, kecepatan angin maksimum, dan curah hujan harian terkalibrasi dari Stasiun Meteorologi Kelas I Soekarno-Hatta.',
        'owner_org': 'bbmkg-wilayah-2',
        'groups': [{'name': 'meteorologi'}],
        'tags': [
            {'name': 'cuaca'},
            {'name': 'meteorologi'},
            {'name': 'suhu'},
            {'name': 'curah-hujan'},
            {'name': 'soekarno-hatta'}
        ],
        'extras': [
            {'key': 'pilar_mkg', 'value': 'meteorologi'},
            {'key': 'resolusi_temporal', 'value': 'Harian'},
            {'key': 'cakupan_temporal', 'value': '01 Agu 2026 – 31 Agu 2026'},
            {'key': 'stasiun_wmo', 'value': '96749'},
            {'key': 'stasiun_nama', 'value': 'Stasiun Meteorologi Kelas I Soekarno-Hatta (BBMKG Wilayah II)'}
        ],
        'license_id': 'cc-by'
    }

    res_pkg = post_action('package_create', pkg_payload)
    pkg_id = None
    if res_pkg.get('success'):
        print(f"[OK] Dataset created: {dataset_name}")
        pkg_id = res_pkg['result']['id']
    else:
        err = res_pkg.get('error', {})
        print(f"[INFO] Dataset {dataset_name}: {err}")
        # Fetch existing dataset
        show = post_action('package_show', {'id': dataset_name})
        if show.get('success'):
            pkg_id = show['result']['id']

    # 4. Upload CSV Resource
    # 4. Upload CSV Resource (Path Dinamis)
    if pkg_id:
        csv_file_path = '/mnt/c/Users/ASUS-DF/.gemini/antigravity-ide/scratch/portal_open_data_bmkg/sample_data/cuaca_harian_stamet_cengkareng.csv'
        default_csv = os.path.join(BASE_DIR, 'sample_data', 'cuaca_harian_stamet_cengkareng.csv')
        csv_file_path = os.environ.get('SAMPLE_CSV_PATH', default_csv)
        if os.path.exists(csv_file_path):
            print(f"Uploading file: {csv_file_path} to dataset {pkg_id}...")
            upload_headers = {"Authorization": TOKEN}
            upload_headers = {}
            if TOKEN:
                upload_headers["Authorization"] = TOKEN
            data_fields = {
                'package_id': pkg_id,
                'name': 'Data Observasi Cuaca Harian Permukaan Agustus 2026 (CSV)',
                'description': 'Tabel deret waktu parameter cuaca dan iklim harian terkalibrasi BMKG',
                'format': 'CSV'
            }
            with open(csv_file_path, 'rb') as f:
                files = {'upload': f}
                up_res = requests.post(f"{API_URL}/resource_create", headers=upload_headers, data=data_fields, files=files).json()
                if up_res.get('success'):
                    print("[OK] Resource CSV uploaded successfully!")
                else:
                    print("[WARN] Resource upload response:", up_res)
        else:
            print(f"CSV file not found at {csv_file_path}")
            print(f"[WARN] CSV file not found at {csv_file_path}")

    # 5. Verify Package List & Detail
    pkg_list = requests.get(f"{API_URL}/package_list").json()
    print("\n=== Dataset List in CKAN ===")
    print("Total:", len(pkg_list.get('result', [])))
    for p in pkg_list.get('result', []):
        print(" -", p)
    try:
        pkg_list = requests.get(f"{API_URL}/package_list", headers=HEADERS).json()
        print("\n=== Dataset List in CKAN ===")
        print("Total:", len(pkg_list.get('result', [])))
        for p in pkg_list.get('result', []):
            print(" -", p)
    except Exception as e:
        print("[WARN] Gagal mengambil package_list:", e)

if __name__ == '__main__':
    main()

