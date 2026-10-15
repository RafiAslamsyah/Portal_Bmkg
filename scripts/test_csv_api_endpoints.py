import urllib.request
import json

tests = [
    ('1. Dokumentasi & Spek API', 'http://localhost:5000/api/csv/docs'),
    ('2. Katalog Seluruh Dataset CSV', 'http://localhost:5000/api/csv/datasets'),
    ('3. Filter Dataset Pilar Klimatologi', 'http://localhost:5000/api/csv/datasets?pillar=klimatologi'),
    ('4. Data Observasi Cuaca JSON', 'http://localhost:5000/api/csv/cuaca-harian-cengkareng?limit=2'),
    ('5. Stream Mentah CSV Cuaca', 'http://localhost:5000/api/csv/cuaca-harian-cengkareng.csv'),
    ('6. Metadata Skema & Statistik Kolom', 'http://localhost:5000/api/csv/cuaca-harian-cengkareng/schema'),
    ('7. Curah Hujan Dasarian Filter Kolom', 'http://localhost:5000/api/csv/curah-hujan-dasarian?provinsi=Jawa+Barat'),
    ('8. Kualitas Udara PM2.5 Paginasi', 'http://localhost:5000/api/csv/kualitas-udara-pm25?limit=5'),
    ('9. Kerapatan Petir Search Kata Kunci', 'http://localhost:5000/api/csv/kerapatan-petir-jabar?q=Bandung'),
    ('10. Dataset CSV dari CKAN FileStore', 'http://localhost:5000/api/csv/contoh?limit=2'),
]

print("==================================================================")
print("  PENGUJIAN ENDPOINT REST API DATASET CSV PORTAL OPEN DATA BMKG")
print("==================================================================")

all_passed = True
for name, url in tests:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            code = resp.getcode()
            content_type = resp.headers.get('Content-Type', '').split(';')[0]
            cors = resp.headers.get('Access-Control-Allow-Origin', '')
            data = resp.read()
            print(f"[PASS] {name}")
            print(f"       URL     : {url}")
            print(f"       Status  : {code} OK | Content-Type: {content_type} | CORS: {cors} | Ukuran: {len(data)} bytes\n")
    except Exception as e:
        all_passed = False
        print(f"[FAIL] {name}: {e}\n")

if all_passed:
    print("==================================================================")
    print("  SEMUA 10 PENGUJIAN ENDPOINT REST API CSV BERHASIL SEMPURNA (100%)")
    print("==================================================================")
