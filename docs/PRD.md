# Product Requirements Document (PRD)
## Portal Open Data BMKG (Berbasis CKAN 2.12)

| Metadata Dokumen | Deskripsi |
| :--- | :--- |
| **Nama Proyek** | Portal Open Data BMKG |
| **Basis Teknologi** | CKAN 2.12.0 (Python 3.10 venv, Native Ubuntu 22.04 LTS) |
| **Kategori Sistem** | Enterprise Open Data Portal / Katalog Data Terbuka Nasional Sektoral |
| **Inspirasi UI/UX** | Portal Satu Data Indonesia & Identitas Visual BMKG |
| **Status Dokumen** | Baseline Arsitektur & Spesifikasi Kebutuhan (v1.0) |

---

## 1. Latar Belakang & Visi Produk

### 1.1 Latar Belakang
Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) mengelola volume data observasi, prediksi, dan rekaman historis yang sangat besar di bidang cuaca, iklim, kualitas udara, gempa bumi, dan tsunami. Untuk mewujudkan prinsip **Satu Data Indonesia (Perpres 39/2019)** dan keterbukaan informasi publik, BMKG membutuhkan portal data terbuka yang terstandarisasi, mudah diakses masyarakat, terintegrasi melalui API, dan memiliki kemampuan pencarian geospasial yang tangguh.

### 1.2 Visi Produk
Membangun **Portal Open Data BMKG** kelas institusi berbasis **CKAN 2.12.0** yang andal, aman, berkinerja tinggi, dan patuh pada prinsip *FAIR Data* (Findable, Accessible, Interoperable, Reusable) untuk seluruh dataset MKG (Meteorologi, Klimatologi, Geofisika, Kualitas Udara).

---

## 2. Target Pengguna (User Personas)

1. **Masyarakat Umum / Jurnalis Data**
   - *Kebutuhan:* Menemukan data cuaca ekstrem, tren suhu tahunan, gempa bumi terkini dalam format ramah pakai (CSV, PDF, Excel) dan preview visual cepat (tabel, peta, grafik).
2. **Peneliti / Akademisi / Saintis Data**
   - *Kebutuhan:* Mengunduh data historis time-series, parameter meteorologi/klimatologi/geofisika dengan metadata standar ISO 19115/FGDC, serta akses langsung via CKAN Action API & DataStore API.
3. **Pengembang Aplikasi (Developers / Startups)**
   - *Kebutuhan:* Akses programmatic instan ke DataStore API (`datastore_search`, SQL query) untuk integrasi aplikasi mitigasi bencana, pertanian presisi, maritim, dan logistik.
4. **Wali Data & Produsen Data BMKG (Data Custodians / Curators)**
   - *Kebutuhan:* Dashboard administrasi untuk mengunggah dataset, validasi format otomatis, pemetaan metadata spesifik MKG (stasiun WMO, bounding box spasial, frekuensi observasi), dan alur kurasi sebelum publikasi.

---

## 3. Ruang Lingkup Produk (Scope)

### 3.1 In-Scope
- **Katalog Dataset MKG:** Pengelompokan dataset ke dalam 4 pilar utama BMKG (Meteorologi, Klimatologi, Geofisika, Kualitas Udara) dan Organisasi (Kedeputian, Balai Besar Wilayah I-V, Stasiun UPT).
- **DataStore & API Publik:** Dukungan query tabular SQL-like via API RESTful read-only untuk dataset CSV/Excel.
- **Pencarian Geospasial & Spatial Harvesting:** Integrasi `ckanext-spatial` (Solr spatial / PostGIS) untuk pencarian berbasis peta (Bounding Box) dan ekstraksi geometri.
- **Resource Preview Geospasial & Tabular:** Integrasi `ckanext-geoview` (Leaflet/OpenLayers) untuk pratinjau GeoJSON/Shapefile/WMS/KML dan preview tabel DataStore.
- **Loader Otomatis Dataset:** Penelusuran dan pemuatan data terotomatisasi (DataPusher+ atau XLoader) ke dalam PostgreSQL DataStore.
- **Kustomisasi Tema & Skema BMKG:** Ekstensi terpadu `ckanext-bmkg` yang memuat tema visual berstandar Satu Data, metadata schema kustom MKG, dan komponen navigasi khas BMKG.

### 3.2 Out-of-Scope (Fase Ini)
- Penanganan data binary raw radar Doppler / satelit resolusi penuh bergiga-giga byte per file (diarahkan melalui link eksternal / OpenSearch / S3 object storage bucket, bukan raw upload ke PostgreSQL).
- Penggunaan platform berbasis kontainer/Docker (arsitektur mengunci implementasi pada **native Ubuntu 22.04 LTS** sesuai runbook).

---

## 4. Fitur Utama & Kebutuhan Fungsional (FR)

### FR-01: Manajemen Dataset & Metadata Spesifik MKG
- Formulir input dataset wajib memiliki atribut:
  - **Pilar Data:** Meteorologi, Klimatologi, Geofisika, atau Kualitas Udara.
  - **Identitas Stasiun:** Nama Stasiun, ID Stasiun BMKG/WMO, Wilayah Administrasi (Provinsi/Kabupaten).
  - **Cakupan Spasial:** Titik koordinat stasiun atau GeoJSON Bounding Box wilayah observasi.
  - **Cakupan Temporal:** Frekuensi pembaruan (Realtime, Harian, Bulanan, Tahunan), rentang tahun/tanggal data.
  - **Lisensi Data:** Standar Creative Commons (CC-BY 4.0) atau Lisensi Terbuka Pemerintah Indonesia.

### FR-02: Pencarian & Filtering (Faceted & Spatial Search)
- Full-text search cepat menggunakan Apache Solr 9.
- Faceted filtering berdasarkan: Pilar/Topik, Organisasi UPT/Kedeputian, Format File (CSV, JSON, GeoJSON, NetCDF, KML), Lisensi, dan Tag.
- Peta interaktif untuk Spatial Filter: User dapat menggambar kotak seleksi (bounding box) pada peta Indonesia untuk menemukan dataset yang mencakup area tersebut.

### FR-03: DataStore & Open Data API
- Dataset tabular (CSV) yang diunggah otomatis masuk ke PostgreSQL DataStore.
- Endpoint API publik `datastore_search` dan `datastore_search_sql` dapat diakses oleh publik dengan hak akses **Read-Only**.
- Endpoint Action API standar CKAN (`package_search`, `package_show`, `resource_show`).

### FR-04: Visualisasi & Data Preview Interaktif
- **Table Preview:** Pratinjau data tabular instan dengan pagination, filtering kolom, dan sorting.
- **Geoview / Map Preview:** Dataset format GeoJSON dan KML otomatis dirender dalam peta interaktif (Leaflet-based).
- **Grafik / Chart Preview:** Kemampuan dasar plotting time-series sederhana pada kolom numerik data iklim/cuaca.

### FR-05: Antarmuka Modern ala Portal Satu Data BMKG
- Desain antarmuka publik responsif, modern, dan bersih dengan palet warna resmi BMKG (Biru Laut BMKG `#003366`, Aksen Emas/Oranye `#F59E0B`, dan Slate Clean `#0F172A`).
- Banner pencarian hero dengan statistik dataset terbuka BMKG (Jumlah Dataset, Jumlah Grup/Pilar, Jumlah Organisasi).
- Halaman dataset detail dengan informasi metadata lengkap, tombol unduh terstandar, dan cuplikan kode API (cURL, Python, R, JavaScript).

---

## 5. Kebutuhan Non-Fungsional (NFR) & Batasan Ketat

| Kategori | Spesifikasi & Batasan Ketat |
| :--- | :--- |
| **Sistem Operasi** | Local: WSL2 Ubuntu 22.04 LTS (x86_64, systemd aktif). Server: Ubuntu Server 22.04 LTS x86_64. |
| **Metode Deployment** | **Native Ubuntu, TANPA Docker** (sesuai dokumen acuan). |
| **Versi Runtime** | CKAN 2.12.0 stable (terkunci, dilarang branch master), Python 3.10 dalam virtual environment terisolasi (`/usr/lib/ckan/default`). |
| **Keamanan Python** | Tidak menyentuh / merusak Python sistem Ubuntu. Semua paket diinstal via venv non-root. |
| **Isolasi Database** | Database CKAN (`ckan_default`) dan DataStore (`datastore_default`) dipisahkan. User `ckan_default` (read/write CKAN) dan user DataStore read-only terpisah mutlak. |
| **Keamanan Jaringan** | PostgreSQL, Redis, Apache Solr 9, dan uWSGI **hanya mengikat (listen) pada localhost/private interface**, tidak terekspos ke publik. |
| **Keamanan Web** | NGINX bertindak sebagai reverse proxy dan TLS termination. Port 80 diarahkan otomatis ke 443. |
| **Loader DataStore** | Uji DataPusher+ vs XLoader. **Dilarang keras memakai DataPusher klasik (deprecated)** dan dilarang mengaktifkan keduanya bersamaan. |
| **Kerahasiaan Kredensial** | Secret token, konfigurasi produksi `ckan.ini`, password DB, dan sertifikat TLS **dilarang masuk ke repositori Git**. |

---

## 6. Metrik Keberhasilan (Definition of Done)
1. Seluruh 8 gerbang kelulusan roadmap (Fase 0 s/d Fase 7) terpenuhi dan diverifikasi secara bertahap.
2. Dataset sampel meteorologi, klimatologi, dan geospasial BMKG berhasil diunggah, terindeks di Solr, tampil di antarmuka web, terpetakan di spatial search, dan dapat di-query via DataStore API publik.
3. Kustomisasi tema dan skema BMKG tersimpan rapi dalam repositori ekstensi mandiri `ckanext-bmkg`.
