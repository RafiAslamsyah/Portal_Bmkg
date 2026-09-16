# Roadmap Implementasi & Verifikasi Gerbang Kelulusan (Exit Gates)
## Portal Open Data BMKG — Native Ubuntu Runbook Verification

Dokumen ini adalah panduan operasional langkah-demi-langkah dari **Fase 0 hingga Fase 7**.
Setiap fase **WAJIB** lulus kriteria pengujian sebelum berpindah ke fase berikutnya, menjamin kepatuhan penuh pada prinsip *"perubahan bertahap, versi dikunci, setiap fase diuji sebelum berlanjut"*.

---

## Ringkasan Roadmap & Gerbang Kelulusan

| Fase | Sasaran Utama | Gerbang Kelulusan (Exit Gate) | Perintah / Uji Verifikasi Kunci |
| :---: | :--- | :--- | :--- |
| **0** | **Audit WSL2 & Sumber Daya** | Ubuntu 22.04, x86_64, systemd aktif, storage memadai (>20GB) | `lsb_release -a`, `uname -m`, `systemctl is-system-running`, `df -h` |
| **1** | **Baseline Ubuntu Lokal** | Update aman, user non-root aktif, service dasar sehat | `sudo apt update && sudo apt upgrade -y`, user `ckan` siap |
| **2** | **PostgreSQL, Redis, Solr 9** | Ketiganya lulus health check lokal di localhost | `pg_isready`, `redis-cli ping`, `curl http://localhost:8983/solr/admin/info/system` |
| **3** | **CKAN 2.12 (Python 3.10 venv)** | CKAN UI & Action API merespons di port lokal | `curl -s http://localhost:5000/api/3/action/status_show \| jq .success` |
| **4** | **FileStore & DataStore** | Upload berkas jalan, API `datastore_search` & izin read/write lulus | Uji curl insert & query read-only user `datastore_ro` |
| **5** | **Loader Otomatis** | CSV uji terimpor otomatis & preview tabel muncul | Upload CSV cuaca BMKG -> ter-ingest ke DataStore |
| **6** | **Geospasial** | GeoJSON tampil di peta, metadata bbox terindeks, API spatial search lulus | Query spatial bounding box via API & preview Leaflet |
| **7** | **Ekstensi BMKG (`ckanext-bmkg`)**| Tema Satu Data BMKG & metadata schema MKG aktif di repo terpisah | Tampilan portal beridentitas BMKG & form metadata MKG valid |

---

## Rincian Prosedur dan Protokol Pengujian Per Fase

### Fase 0: Audit Lingkungan WSL2 & Sumber Daya
*Tujuan:* Memastikan lingkungan OS dan hardware memenuhi spesifikasi minimum sebelum instalasi paket.
- **Pemeriksaan OS:** Ubuntu 22.04 LTS (`jammy`).
- **Arsitektur:** x86_64 (`amd64`).
- **Init System:** Systemd aktif pada WSL2 (cek `/etc/wsl.conf` memiliki `[boot] systemd=true`).
- **Kapasitas Disk:** Tersedia minimal 20GB free space pada partisi `/`.
- **Kriteria Kelulusan (Gate 0):** Seluruh parameter bernilai OK dan systemd merespons tanpa error fatal.

---

### Fase 1: Baseline Ubuntu Lokal & User Non-Root
*Tujuan:* Mempersiapkan pustaka build, dependensi native, dan user terisolasi.
- **Batasan Keselamatan:** CKAN dilarang dijalankan sebagai root.
- **Langkah Utama:**
  1. Pembaruan repositori paket APT sistem.
  2. Instalasi dependensi native: `build-essential`, `python3.10-dev`, `libpq-dev`, `libxml2-dev`, `libxslt1-dev`, `libgeos-dev`, `libproj-dev`, `git`.
  3. Pembuatan user sistem non-root: `sudo useradd -m -s /bin/bash -d /usr/lib/ckan ckan`.
- **Kriteria Kelulusan (Gate 1):** User non-root siap, hak sudo terbatas tersedia, dependensi terpasang tanpa konflik.

---

### Fase 2: Service Backend (PostgreSQL, Redis, Apache Solr 9)
*Tujuan:* Menyiapkan 3 layanan pendukung di localhost tanpa ekspos publik.
- **Batasan Keselamatan:** PostgreSQL, Redis, dan Solr **hanya listen pada 127.0.0.1**.
- **PostgreSQL Setup:**
  - Database katalog: `ckan_default` (Owner: `ckan_default`).
  - Database DataStore: `datastore_default` (Owner: `ckan_default`).
  - Read-Only User: `datastore_ro` (diberi hak `GRANT SELECT` saja).
  - Ekstensi geospasial: `postgis` diaktifkan pada kedua database.
- **Apache Solr 9 Setup:**
  - Pasang Solr 9.x mandiri.
  - Buat core `ckan`.
  - Pasang `managed-schema` / `schema.xml` bawaan CKAN 2.12.
- **Redis Setup:**
  - Jalankan `redis-server` mengikat ke loopback `127.0.0.1:6379`.
- **Kriteria Kelulusan (Gate 2):**
  - `pg_isready -h localhost` -> *accepting connections*
  - `redis-cli -h localhost ping` -> `PONG`
  - `curl http://127.0.0.1:8983/solr/ckan/admin/ping` -> `status: "OK"`

---

### Fase 3: Instalasi CKAN 2.12.0 dalam Python 3.10 venv
*Tujuan:* Memasang inti CKAN 2.12.0 stable secara native dalam virtualenv terisolasi.
- **Batasan Keselamatan:** Python sistem tidak boleh diubah. Dilarang menggunakan branch master / tag unpinned.
- **Langkah Utama:**
  1. Buat venv: `python3.10 -m venv /usr/lib/ckan/default`.
  2. Pasang setuptools & wheel pinned: `pip install --upgrade pip setuptools wheel`.
  3. Pasang CKAN 2.12.0 stable: `pip install ckan==2.12.0`.
  4. Generate konfigurasi: `ckan generate config /etc/ckan/default/ckan.ini`.
  5. Inisialisasi DB: `ckan -c /etc/ckan/default/ckan.ini db init`.
- **Kriteria Kelulusan (Gate 3):**
  - Web service CKAN merespons di `http://127.0.0.1:5000`.
  - Panggilan API: `curl http://127.0.0.1:5000/api/3/action/status_show` mengembalikan `success: true`.

---

### Fase 4: Konfigurasi FileStore & DataStore
*Tujuan:* Mengaktifkan penyimpanan berkas lokal dan engine tabel data interaktif.
- **Langkah Utama:**
  1. Konfigurasi direktori FileStore: `/var/lib/ckan/default/resources` dengan izin kepemilikan user `ckan:www-data`.
  2. Konfigurasi `ckan.datastore.write_url` dan `ckan.datastore.read_url` pada `ckan.ini`.
  3. Set permissions database: `ckan -c /etc/ckan/default/ckan.ini datastore set-permissions | sudo -u postgres psql`.
- **Kriteria Kelulusan (Gate 4):**
  - Berkas uji CSV dapat diunggah melalui antarmuka atau API.
  - Endpoint `datastore_search` berhasil membaca tabel via user read-only `datastore_ro`.

---

### Fase 5: Loader Otomatis (Uji Komparasi DataPusher+ vs XLoader)
*Tujuan:* Memilih dan mengaktifkan satu loader otomatis untuk mengubah CSV menjadi tabel DataStore.
- **Batasan Keselamatan:** Dilarang mengaktifkan DataPusher klasik. Dilarang mengaktifkan keduanya bersamaan!
- **Langkah Pengujian:**
  1. Uji Ingest CSV Observasi Harian BMKG (10.000 baris data cuaca).
  2. Bandingkan kecepatan ingest, stabilitas memory, dan akurasi inferensi tipe data (float, datetime, integer).
  3. Aktifkan loader terpilih di `ckan.ini`.
- **Kriteria Kelulusan (Gate 5):**
  - Dataset CSV BMKG yang diunggah otomatis di-push ke DataStore dalam hitungan detik.
  - Preview tabel data interaktif langsung muncul di halaman web resource CKAN.

---

### Fase 6: Geospasial (`ckanext-spatial` & `ckanext-geoview`)
*Tujuan:* Menghubungkan kemampuan spasial dan pratinjau peta interaktif.
- **Langkah Utama:**
  1. Pasang `ckanext-spatial` dan konfigurasi Solr spatial field (`spatial_geom`).
  2. Aktifkan plugin `spatial_metadata`, `spatial_query`.
  3. Pasang `ckanext-geoview` dan aktifkan preview plugin `geo_view`, `geojson_view`.
- **Kriteria Kelulusan (Gate 6):**
  - Dataset berformat GeoJSON tampil langsung di peta Leaflet tanpa error.
  - Bounding Box terindeks di Solr.
  - Query API `package_search?q=*:*&extras={"ext_bbox":"..."}` berhasil mengembalikan dataset dalam poligon uji.

---

### Fase 7: Ekstensi Kustom BMKG (`ckanext-bmkg`)
*Tujuan:* Menerapkan branding visual ala Portal Satu Data BMKG dan skema metadata MKG.
- **Batasan Keselamatan:** Ekstensi berada di repositori terpisah dari CKAN core. File rahasia/kredensial dilarang masuk Git.
- **Langkah Utama:**
  1. Pembuatan boilerplate ekstensi: `ckanext-bmkg`.
  2. Implementasi Tema:
     - Header, Footer, Banner Hero dengan visualisasi Satu Data BMKG.
     - Palet warna institusi (Biru Laut BMKG `#003366`, Aksen Emas/Oranye `#F59E0B`).
  3. Implementasi Skema Metadata MKG:
     - 4 Pilar Grup (Meteorologi, Klimatologi, Geofisika, Kualitas Udara).
     - Atribut kustom stasiun, tipe sensor, resolusi waktu, dan bounding box.
- **Kriteria Kelulusan (Gate 7):**
  - Tema BMKG aktif dan tampil elegan di browser.
  - Form input dataset menampilkan field metadata khusus MKG.
  - Seluruh kode ekstensi terlindungi dalam repositori Git dengan `.gitignore` yang aman.
