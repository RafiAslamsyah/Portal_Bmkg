import urllib.request
import json

tests = [
    ('1. Dokumentasi & Spek API (JSON)', 'http://localhost:5000/api/csv/docs?format=json', 'GET', None, None),
    ('2. Portal Dokumentasi Interaktif (HTML)', 'http://localhost:5000/api/csv/docs', 'GET', {'Accept': 'text/html'}, None),
    ('3. Spesifikasi OpenAPI 3.0', 'http://localhost:5000/api/csv/openapi.json', 'GET', None, None),
    ('4. Katalog Seluruh Dataset CSV', 'http://localhost:5000/api/csv/datasets', 'GET', None, None),
    ('5. Filter Dataset Pilar Klimatologi', 'http://localhost:5000/api/csv/datasets?pillar=klimatologi', 'GET', None, None),
    ('6. Data Observasi Cuaca JSON', 'http://localhost:5000/api/csv/cuaca-harian-cengkareng?limit=2', 'GET', None, None),
    ('7. Stream Mentah CSV Cuaca', 'http://localhost:5000/api/csv/cuaca-harian-cengkareng.csv', 'GET', None, None),
    ('8. Metadata Skema & Statistik Kolom', 'http://localhost:5000/api/csv/cuaca-harian-cengkareng/schema', 'GET', None, None),
    ('9. Curah Hujan Dasarian Filter Kolom', 'http://localhost:5000/api/csv/curah-hujan-dasarian?provinsi=Jawa+Barat', 'GET', None, None),
    ('10. Kualitas Udara PM2.5 Paginasi', 'http://localhost:5000/api/csv/kualitas-udara-pm25?limit=5', 'GET', None, None),
    ('11. Kerapatan Petir Search Kata Kunci', 'http://localhost:5000/api/csv/kerapatan-petir-jabar?q=Bandung', 'GET', None, None),
    ('12. Konversi Teks CSV ke API Endpoint (POST)', 'http://localhost:5000/api/csv/convert', 'POST', {'Content-Type': 'application/json'}, json.dumps({
        'filename': 'uji_stasiun.csv',
        'csv_data': 'Tanggal,Lokasi,Suhu_C,Kelembapan\n2026-08-01,Stasiun Kemayoran,28.5,80\n2026-08-02,Stasiun Curug,29.1,75'
    }).encode('utf-8')),
]

print("==================================================================")
print("  PENGUJIAN ENDPOINT REST API DATASET CSV PORTAL OPEN DATA BMKG")
print("==================================================================")

all_passed = True
for name, url, method, headers, body in tests:
    try:
        req = urllib.request.Request(url, data=body, method=method)
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
        with urllib.request.urlopen(req, timeout=5) as resp:
            code = resp.getcode()
            content_type = resp.headers.get('Content-Type', '').split(';')[0]
            cors = resp.headers.get('Access-Control-Allow-Origin', '')
            data = resp.read()
            print(f"[PASS] {name}")
            print(f"       Method  : {method} | URL: {url}")
            print(f"       Status  : {code} OK | Content-Type: {content_type} | CORS: {cors} | Ukuran: {len(data)} bytes\n")
    except Exception as e:
        all_passed = False
        print(f"[FAIL] {name}: {e}\n")

if all_passed:
    print("==================================================================")
    print(f"  SEMUA {len(tests)} PENGUJIAN ENDPOINT REST API CSV BERHASIL SEMPURNA (100%)")
    print("==================================================================")
else:
    print("==================================================================")
    print("  BEBERAPA PENGUJIAN GAGAL — SILAKAN PERIKSA LOG SERVER")
    print("==================================================================")
