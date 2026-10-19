# Panduan Lengkap Fitur CSV to REST API Endpoint Publik
## Portal Open Data BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)

---

### 1. Ringkasan Fitur

Fitur **CSV to REST API Endpoint** adalah inovasi keterbukaan data pada Portal Open Data BMKG yang mentransformasikan seluruh dataset tabular berformat CSV menjadi REST API endpoint terbuka (*public-facing*) berstandar tinggi. Fitur ini dirancang sesuai mandat **Peraturan Presiden No. 39 Tahun 2019 tentang Satu Data Indonesia (SDI)** dan **WMO Unified Data Policy (Resolution 1)**.

Dengan fitur ini, masyarakat umum, peneliti, akademisi, instansi pemerintah, pengembang aplikasi, dan pembuat kebijakan dapat:
1. Mengambil baris data observasi BMKG secara terprogram (*programmatic access*) dalam format **JSON** yang rapi dan terstruktur.
2. Memfilter data secara dinamis berdasarkan parameter kolom spesifik (misal: `provinsi`, `stasiun`, dsb.), pencarian kata kunci bebas (`q`), pengurutan data (`sort`), dan paginasi (`limit` & `offset`).
3. Mengakses dan mengalirkan berkas CSV murni (**RFC 4180**) langsung ke pustaka analisis data seperti **Python Pandas**, **R**, **Julia**, atau **Microsoft Excel / Power BI**.
4. Memeriksa metadata tipe data kolom dan ringkasan statistik deskriptif (*min*, *max*, *mean*, *sample values*) secara otomatis melalui endpoint `/schema`.
5. Mengonversi berkas CSV eksternal dari URL atau teks CSV kustom secara instan (*on-the-fly*) menjadi REST API melalui endpoint `/remote` dan `/convert`.
6. Seluruh endpoint dapat diakses **tanpa autentikasi/API key** (100% publik) dan telah dilengkapi header **CORS** (`Access-Control-Allow-Origin: *`) agar dapat dipanggil langsung dari aplikasi web berbasis peramban (frontend React, Vue, Angular, mobile app, dll).

---

### 2. Arsitektur & Mekanisme Kerja

```
                                      +------------------------------------+
                                      | Pengguna Publik / Peneliti / App   |
                                      +------------------------------------+
                                              |                ^
                Permintaan REST API (GET/POST)|                | Respon JSON / CSV
                                              v                | (CORS: *)
                        +-----------------------------------------------+
                        |   Portal Open Data BMKG (Flask Blueprint)     |
                        |   Prefix: /api/csv/*                          |
                        +-----------------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
         [Jalur A: DataStore Terindeks]                    [Jalur B: FileStore Fallback]
          PostgreSQL Database (datastore)                   Berkas CSV Lokal / URL Eksternal
                     |                                                 |
      - Eksekusi query SQL dinamis                       - DictReader streaming dengan caching
      - Paginasi LIMIT & OFFSET                          - Filter kolom & pencarian memori cepat
      - Agregasi statistik kolom                         - Kalkulasi skema & ringkasan statistik
                     |                                                 |
                     +------------------------+------------------------+
                                              |
                                              v
                              +-------------------------------+
                              | Format Output:                |
                              | 1. application/json           |
                              | 2. text/csv (RFC 4180)        |
                              | 3. text/html (Swagger UI)     |
                              +-------------------------------+
```

1. **Jalur Utama (DataStore PostgreSQL):** Jika resource CSV telah diunggah ke DataStore CKAN, pencarian dan pemfilteran diproses langsung oleh mesin database PostgreSQL BMKG dengan indeks performa tinggi.
2. **Jalur Cadangan (FileStore / URL Reader):** Jika dataset berupa berkas CSV statis pada penyimpanan berkas atau URL unduhan, sistem membaca berkas secara efisien, mengurai baris *header*, lalu memfilter dan memformat respons JSON secara *in-memory* tanpa kegagalan.

---

### 3. Daftar Spesifikasi Endpoint API

Base URL API:
- Lingkungan Lokal / Uji Coba: `http://localhost:5000/api/csv`
- Lingkungan Server Produksi: `https://data.bmkg.go.id/api/csv`

| No | Endpoint | Metode | Tipe Konten | Deskripsi |
|---|---|---|---|---|
| 1 | `/api/csv/docs` | GET | `text/html` / `application/json` | Portal dokumentasi interaktif Swagger/Redoc jika dibuka di peramban, atau spesifikasi ringkas jika meminta format JSON (`?format=json`). |
| 2 | `/api/csv/openapi.json` | GET | `application/json` | Dokumen spesifikasi OpenAPI 3.0 resmi untuk integrasi Swagger UI, Postman, Insomnia, dan generator SDK. |
| 3 | `/api/csv/datasets` | GET | `application/json` | Katalog seluruh dataset CSV publik yang aktif di BMKG, lengkap dengan metadata, pilar, dan URL endpoint masing-masing. |
| 4 | `/api/csv/<dataset_name>` | GET | `application/json` | Mengambil data observasi terstruktur dari dataset tertentu dengan filter query dinamis dan paginasi. |
| 5 | `/api/csv/<dataset_name>.csv` | GET | `text/csv` | Mengalirkan berkas CSV murni (RFC 4180) yang siap dibaca oleh Pandas (`pd.read_csv`) atau diunduh ke Excel (`?download=1`). |
| 6 | `/api/csv/<dataset_name>/schema` | GET | `application/json` | Ringkasan struktur kolom, deteksi tipe data (`numeric`, `text`), statistik deskriptif (*min*, *max*, *mean*), dan sampel nilai. |
| 7 | `/api/csv/remote` | GET | `application/json` | Konverter instan: mengubah berkas CSV dari sembarang URL publik menjadi REST API JSON seketika (`?url=...`). |
| 8 | `/api/csv/convert` | POST | `application/json` | Mengunggah berkas CSV multipart atau mengirimkan string CSV mentah untuk dikonversi menjadi JSON dan skema. |

---

### 4. Parameter Query

Setiap pemanggilan data pada `/api/csv/<dataset_name>` mendukung parameter query fleksibel:

| Parameter | Tipe Data | Default | Contoh Nilai | Keterangan |
|---|---|---|---|---|
| `limit` | integer | `100` | `?limit=10` | Batas maksimum jumlah baris yang dikembalikan (maksimal 10.000, isi `0` untuk semua). |
| `offset` | integer | `0` | `?offset=20` | Indeks baris awal untuk mekanisme paginasi data. |
| `q` | string | - | `?q=Bandung` | Pencarian kata kunci bebas yang mencocokkan nilai di semua kolom dataset. |
| `sort` | string | - | `?sort=suhu_max desc` | Pengurutan kolom (tambahkan `asc` atau `desc`). |
| `<nama_kolom>` | string | - | `?provinsi=Jawa+Barat` | Filter nilai kolom tertentu secara spesifik dan presisi. |
| `download` | boolean | `0` | `?download=1` | Hanya untuk endpoint `.csv`, memicu unduhan berkas attachment di browser. |

---

### 5. Contoh Struktur Respons JSON

#### Permintaan Data:
`GET http://localhost:5000/api/csv/cuaca-harian-cengkareng?limit=2`

```json
{
  "success": true,
  "meta": {
    "dataset_name": "cuaca-harian-cengkareng",
    "dataset_title": "Data Observasi Cuaca Harian Stasiun Meteorologi Cengkareng",
    "resource_id": "0fe3cf82-f542-4217-a006-258169fe5a72",
    "source_type": "datastore",
    "total_records": 31,
    "returned_records": 2,
    "limit": 2,
    "offset": 0,
    "fields": [
      "Tanggal",
      "Suhu_Min_C",
      "Suhu_Max_C",
      "Suhu_Rata_C",
      "Kelembapan_Rata_Persen",
      "Curah_Hujan_mm",
      "Kecepatan_Angin_Max_knot"
    ],
    "filters_applied": {
      "q": null,
      "sort": null,
      "columns": {}
    }
  },
  "data": [
    {
      "Tanggal": "2026-08-01",
      "Suhu_Min_C": "24.6",
      "Suhu_Max_C": "33.2",
      "Suhu_Rata_C": "28.4",
      "Kelembapan_Rata_Persen": "78",
      "Curah_Hujan_mm": "0.0",
      "Kecepatan_Angin_Max_knot": "14"
    },
    {
      "Tanggal": "2026-08-02",
      "Suhu_Min_C": "25.0",
      "Suhu_Max_C": "34.0",
      "Suhu_Rata_C": "28.9",
      "Kelembapan_Rata_Persen": "75",
      "Curah_Hujan_mm": "2.4",
      "Kecepatan_Angin_Max_knot": "12"
    }
  ]
}
```

#### Permintaan Skema Data:
`GET http://localhost:5000/api/csv/cuaca-harian-cengkareng/schema`

```json
{
  "success": true,
  "dataset_name": "cuaca-harian-cengkareng",
  "dataset_title": "Data Observasi Cuaca Harian Stasiun Meteorologi Cengkareng",
  "total_columns": 7,
  "columns": [
    {
      "column": "Tanggal",
      "type": "text",
      "non_null_count": 31,
      "sample_values": ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"]
    },
    {
      "column": "Suhu_Max_C",
      "type": "numeric",
      "non_null_count": 31,
      "stats": {
        "min": 31.0,
        "max": 35.4,
        "mean": 33.15
      },
      "sample_values": ["33.2", "34.0", "32.8", "33.5"]
    }
  ]
}
```

---

### 6. Panduan Integrasi Kode Pengembang

#### A. Python (Pandas) — Analisis & Data Science
```python
import pandas as pd

# 1. Baca langsung sebagai DataFrame Pandas dari stream CSV
url_csv = "http://localhost:5000/api/csv/cuaca-harian-cengkareng.csv"
df = pd.read_csv(url_csv)

print(f"Dimensi Data: {df.shape}")
print(df.head())
print("Rata-rata Suhu:", df['Suhu_Rata_C'].mean())
```

#### B. Python (Requests) — Aplikasi Backend
```python
import requests

url = "http://localhost:5000/api/csv/curah-hujan-dasarian"
params = {
    "provinsi": "Jawa Barat",
    "limit": 10,
    "sort": "curah_hujan_mm desc"
}

response = requests.get(url, params=params)
data_json = response.json()

print("Status:", data_json["success"])
print("Total Ditemukan:", data_json["meta"]["total_records"])
for row in data_json["data"]:
    print(f"- {row.get('nama_stasiun')}: {row.get('curah_hujan_mm')} mm")
```

#### C. JavaScript / TypeScript (Modern Fetch) — Frontend Web
```javascript
// Akses API langsung dari Browser (didukung CORS)
async function fetchBMKGData() {
  const url = 'http://localhost:5000/api/csv/kualitas-udara-pm25?limit=5';
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const result = await res.json();
    console.log('Metadata:', result.meta);
    console.table(result.data);
  } catch (err) {
    console.error('Gagal mengambil data BMKG:', err);
  }
}

fetchBMKGData();
```

#### D. cURL — Baris Perintah Terminal
```bash
# 1. Ambil 5 record dalam format JSON
curl -s -X GET "http://localhost:5000/api/csv/kerapatan-petir-jabar?limit=5" | jq .

# 2. Unduh berkas CSV
curl -O -J "http://localhost:5000/api/csv/cuaca-harian-cengkareng.csv?download=1"

# 3. Konversi CSV kustom ke API via POST
curl -X POST "http://localhost:5000/api/csv/convert" \
  -H "Content-Type: application/json" \
  -d '{"filename": "stasiun_uji.csv", "csv_data": "Stasiun,Suhu\nKemayoran,29.4\nCurug,28.8"}'
```

#### E. Bahasa R — Statistik & Riset
```r
# Membaca data langsung dari API CSV BMKG
url <- "http://localhost:5000/api/csv/cuaca-harian-cengkareng.csv"
bmkg_data <- read.csv(url, stringsAsFactors = FALSE)

summary(bmkg_data)
plot(bmkg_data$Suhu_Max_C, type="l", col="blue", main="Fluktuasi Suhu Maksimum BMKG")
```

#### F. Microsoft Excel & Power BI (Web Connector)
1. Buka Microsoft Excel atau Power BI Desktop.
2. Pilih menu **Data** -> **From Web** (Dari Web).
3. Masukkan URL stream CSV: `http://localhost:5000/api/csv/cuaca-harian-cengkareng.csv`
4. Excel / Power BI akan secara otomatis mendeteksi kolom dan mengimpor tabel data untuk divisualisasikan.

---

### 7. Fitur Antarmuka Pengguna (UI)

#### 1. Swagger/Redoc-Style Interactive Portal (`/api/csv/docs`)
- Menyediakan penjelajah interaktif untuk menguji semua parameter query secara *live*.
- Menampilkan contoh cuplikan kode (*code snippet*) yang dapat langsung disalin (*Copy Code*).
- Menampilkan tab skema data dan contoh respons JSON.

#### 2. Live API Playground di Halaman Detail Dataset CKAN
- Setiap halaman dataset berformat CSV di portal utama memiliki panel *Live API Playground*.
- Pengguna dapat memilih format (JSON / CSV Raw / Schema) dan menjalankan pengujian langsung di halaman.

#### 3. CSV to API Studio di Prototipe Portal (`ui_prototype/katalog.html`)
- Tombol **"API Endpoint"** pada setiap kartu dataset di katalog.
- Modal interaktif dengan **Query Builder** (pencarian kata kunci, limit, offset, pengurutan).
- Tab **"Konversi CSV Kustom"** untuk menempelkan teks CSV sembarang atau URL CSV eksternal guna melihat representasi REST API-nya secara langsung.

---

### 8. Koleksi Postman

Berkas Postman Collection v2.1 telah disediakan untuk memudahkan pengujian API:
- Lokasi berkas: `docs/BMKG_Public_CSV_REST_API.postman_collection.json`
- Berisi 12 permintaan terkonfigurasi mencakup semua pilar BMKG, parameter filter, skema, dan konverter POST.
- Siap diimpor langsung ke aplikasi **Postman**, **Insomnia**, atau **Thunder Client**.

---

### 9. Kesimpulan & Manfaat bagi Publik

Implementasi fitur CSV to REST API ini menghadirkan lompatan besar dalam pemanfaatan data terbuka BMKG:
1. **Zero Barrier Entry:** Tidak memerlukan registrasi, pembuatan token, atau otorisasi rumit untuk data publik.
2. **Kinerja & Keandalan:** Terhubung langsung ke DataStore PostgreSQL dengan *fallback* aman ke FileStore.
3. **Ramah Pengembang:** Dilengkapi spesifikasi OpenAPI 3.0, dukungan CORS penuh, dan dokumentasi interaktif.
4. **Sesuai Standar Nasional & Internasional:** Memenuhi standar Satu Data Indonesia (SDI) dan WMO Data Resolution.
