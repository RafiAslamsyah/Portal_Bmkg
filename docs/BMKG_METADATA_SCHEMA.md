# Spesifikasi Skema Metadata & Taksonomi MKG
## Portal Open Data BMKG (`ckanext-bmkg`)

Dokumen ini mendefinisikan standar taksonomi, metadata khusus, dan struktur dataset untuk 4 pilar layanan data Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) mengacu pada standar Satu Data Indonesia (SDI) dan WMO (World Meteorological Organization).

---

## 1. Taksonomi 4 Pilar Layanan BMKG

Dalam portal CKAN, 4 pilar ini diimplementasikan sebagai **Groups** utama:

| Kode Pilar | Nama Pilar | Cakupan Data | Contoh Dataset Terbuka |
| :--- | :--- | :--- | :--- |
| `meteorologi` | **Meteorologi** | Cuaca publik, cuaca maritim/kelautan, cuaca penerbangan, cuaca ekstrem | Data Harian Suhu & Angin Stasiun Meteorologi, Prakiraan Gelombang Signifikan, Citra Radar Komposit Terbuka |
| `klimatologi` | **Klimatologi** | Iklim, tren variabilitas, curah hujan, kekeringan, agro-klimat | Curah Hujan Dasarian & Bulanan, Indeks SPI (Standardized Precipitation Index), Proyeksi Perubahan Iklim RCP/SSP |
| `geofisika` | **Geofisika** | Gempa bumi tektonik, tsunami, petir, magnet bumi, gravitasi | Katalog Gempa Bumi Riwayat M >= 5.0, Kerapatan Sambaran Petir Harian, Data Variasi Harian Geomagnetik |
| `kualitas-udara` | **Kualitas Udara** | Konsentrasi polutan atmosfer, kimia air hujan, gas rumah kaca (GRK) | Konsentrasi Partikulat PM2.5 & PM10 Stasiun GAW/SPKU, Kimia Air Hujan (pH & Konduktivitas), Tren CO2 |

---

## 2. Struktur Hirarki Organisasi (Organizations)

Dataset diproduksi dan dipertanggungjawabkan oleh unit kerja produsen data di BMKG:

1. **Tingkat Pusat (Kedeputian):**
   - `deputi-meteorologi`: Kedeputian Bidang Meteorologi
   - `deputi-klimatologi`: Kedeputian Bidang Klimatologi
   - `deputi-geofisika`: Kedeputian Bidang Geofisika
   - `deputi-infrastruktur`: Kedeputian Bidang Inskalrekjarkom (Jaringan Komunikasi & Instrumentasi)
   - `pusat-penelitian`: Pusat Penelitian dan Pengembangan BMKG
2. **Tingkat Balai Besar MKG Wilayah (BBMKG):**
   - `bbmkg-wilayah-1`: BBMKG Wilayah I Medan (Sumatera)
   - `bbmkg-wilayah-2`: BBMKG Wilayah II Ciputat (Jawa Bagian Barat, Lampung, Banten, DKI, Jabar)
   - `bbmkg-wilayah-3`: BBMKG Wilayah III Denpasar (Bali, NTB, NTT)
   - `bbmkg-wilayah-4`: BBMKG Wilayah IV Makassar (Sulawesi, Maluku)
   - `bbmkg-wilayah-5`: BBMKG Wilayah V Jayapura (Papua)
3. **Tingkat UPT Operasional:**
   - Stasiun Meteorologi (Stamet), Stasiun Klimatologi (Staklim), Stasiun Geofisika (Stageof), Stasiun Pemantau Atmosfer Global (GAW).

---

## 3. Kamus Data & Custom Metadata Fields (Dataset Schema)

Setiap dataset yang didaftarkan ke Portal Open Data BMKG wajib menyertakan atribut metadata khusus berikut (diatur via `ckanext-scheming` atau modul kustom `ckanext-bmkg`):

| Nama Field (Key) | Label Tampilan | Tipe Data | Wajib? | Deskripsi / Nilai Valid |
| :--- | :--- | :--- | :---: | :--- |
| `pilar_mkg` | Pilar Utama BMKG | Dropdown | **Ya** | `meteorologi`, `klimatologi`, `geofisika`, `kualitas_udara` |
| `id_stasiun_bmkg` | Kode Stasiun BMKG / WMO | String | Tidak | Misal: `96749` (Stamet Soekarno Hatta), `96745` (Kemayoran) |
| `nama_stasiun` | Nama Stasiun / Lokasi Observasi | String | **Ya** | Nama resmi UPT / titik stasiun observasi |
| `tipe_sensor` | Tipe Sensor / Pengamatan | Multi-Select | Tidak | `AWS (Automatic Weather Station)`, `ARG (Automatic Rain Gauge)`, `Manual Observasi`, `Seismograf Broadband`, `SPKU PM2.5`, `Radar Cuaca`, `Satelit Himawari` |
| `resolusi_temporal` | Resolusi / Frekuensi Waktu | Dropdown | **Ya** | `Real-time (Menit)`, `Per Jam (Hourly)`, `Harian (Daily)`, `Dasarian (10 Harian)`, `Bulanan (Monthly)`, `Tahunan (Annual)` |
| `cakupan_spasial` | Lingkup Spasial Wilayah | Dropdown | **Ya** | `Nasional (Seluruh RI)`, `Regional Balai`, `Provinsi`, `Kabupaten/Kota`, `Titik Spesifik Stasiun` |
| `spatial` | Bounding Box Geospasial | GeoJSON | **Ya (jika spasial)**| Geometri GeoJSON poligon / Bounding Box untuk query `ckanext-spatial` |
| `waktu_mulai_observasi` | Tanggal Awal Data | Tanggal (YYYY-MM-DD) | **Ya** | Awal mula rentang data observasi pada dataset |
| `waktu_akhir_observasi` | Tanggal Akhir Data | Tanggal (YYYY-MM-DD) | **Ya** | Akhir rentang data observasi pada dataset |
| `parameter_mkg` | Parameter Terukur | Tag List | **Ya** | Contoh: `Suhu Udara`, `Kelembapan`, `Curah Hujan`, `Kecepatan Angin`, `Magnitudo Gempa`, `Kedalaman Gempa`, `PM2.5` |
| `standar_satuan` | Satuan Pengukuran | String | Tidak | Misal: `Derajat Celcius, Milimeter (mm), Knot, SR, µg/m3` |
| `wali_data_kontak` | Kontak Tim Pengelola Data | Email | **Ya** | Email kedeputian / stasiun UPT resmi BMKG |

---

## 4. Format Data Terbuka yang Didukung

Portal Open Data BMKG memprioritaskan format terbuka ramah mesin (*machine-readable*):

1. **Tabular (Di-ingest ke DataStore):**
   - `.csv` (Comma Separated Values, UTF-8, Header Baris 1, separator koma/titik-koma terstandar)
   - `.parquet` / `.arrow` (untuk dataset time-series historis dengan ukuran besar)
2. **Geospasial (Diteruskan ke `ckanext-geoview`):**
   - `.geojson` (Standar RFC 7946, WGS84 CRS EPSG:4343)
   - `.kml` / `.kmz` (Format sebaran titik gempa bumi / jalur radar)
   - Service URL: OGC WMS/WFS dari GeoServer BMKG
3. **Data Multidimensi Ilmiah (FileStore Download):**
   - `.netcdf` (`.nc`) / `.grib2` (Format standar WMO untuk model prediksi numerik atmosfer dan iklim)
