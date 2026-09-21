#!/usr/bin/env python3
# encoding: utf-8
"""
Script Seeding Backend Database CKAN 2.12 - Portal Open Data BMKG
Sesuai standar docs/BMKG_METADATA_SCHEMA.md dan docs/PRD.md:
- 4 Pilar Groups (Meteorologi, Klimatologi, Geofisika, Kualitas Udara)
- 5 Organisasi Unit Teknis & Kedeputian BMKG
- 6 Dataset Terbuka BMKG lengkap dengan metadata spesifik MKG & DataStore Ingest
"""
import os
import sys
import csv
import json

from ckan.cli import load_config
from ckan.config.middleware import make_app
from ckan import model
from ckan.logic import get_action

def get_context():
    admin_user = model.User.by_name('admin_bmkg')
    if not admin_user:
        admin_user = model.User.by_name('admin')
    return {
        'model': model,
        'session': model.Session,
        'user': admin_user.name,
        'auth_user_obj': admin_user
    }

def seed_groups():
    print("\n[1/4] Menginisialisasi 4 Pilar Groups MKG...")
    groups = [
        {
            'name': 'meteorologi',
            'title': 'Meteorologi',
            'description': 'Data observasi cuaca permukaan, prakiraan gelombang laut maritim, cuaca penerbangan, dan radar cuaca komposit.'
        },
        {
            'name': 'klimatologi',
            'title': 'Klimatologi',
            'description': 'Deret waktu iklim historis, pemantauan anomali iklim, data curah hujan dasarian/bulanan, dan indeks kekeringan (SPI).'
        },
        {
            'name': 'geofisika',
            'title': 'Geofisika',
            'description': 'Katalog parameter gempa bumi tektonik M >= 5.0, pemodelan tsunami, kerapatan sambaran petir, dan variasi geomagnetik.'
        },
        {
            'name': 'kualitas-udara',
            'title': 'Kualitas Udara',
            'description': 'Pemantauan konsentrasi partikulat atmosfer PM2.5 & PM10, kimia air hujan, dan gas rumah kaca (GRK).'
        }
    ]

    for g in groups:
        existing = model.Group.by_name(g['name'])
        if existing and not existing.is_organization:
            print(f"  - Group '{g['name']}' sudah ada.")
        else:
            get_action('group_create')(get_context(), g)
            print(f"  + Berhasil membuat Group: {g['title']}")

def seed_organizations():
    print("\n[2/4] Menginisialisasi Organisasi Kedeputian & Balai UPT BMKG...")
    orgs = [
        {
            'name': 'deputi-meteorologi',
            'title': 'Kedeputian Bidang Meteorologi',
            'description': 'Unit penanggung jawab data meteorologi publik, maritim, dan penerbangan nasional.'
        },
        {
            'name': 'deputi-klimatologi',
            'title': 'Pusat Layanan Informasi Iklim Terapan (Kedeputian Bidang Klimatologi)',
            'description': 'Unit penanggung jawab pengolahan data iklim historis, tren variabilitas, dan perubahan iklim.'
        },
        {
            'name': 'deputi-geofisika',
            'title': 'Pusat Gempa Bumi dan Tsunami (Kedeputian Bidang Geofisika)',
            'description': 'Unit operasional monitoring seismik real-time dan peringatan dini tsunami (BMKG TEWS).'
        },
        {
            'name': 'bbmkg-wilayah-2',
            'title': 'Stasiun Meteorologi Kelas I Soekarno-Hatta (BBMKG Wilayah II)',
            'description': 'Unit Pelaksana Teknis observasi cuaca penerbangan dan permukaan wilayah Banten & Jabodetabek.'
        },
        {
            'name': 'gaw-kemayoran',
            'title': 'Stasiun Pemantau Atmosfer Global (GAW) Kemayoran',
            'description': 'Stasiun observasi kualitas udara, partikulat PM2.5, aerosol, dan kimia atmosfer WMO-GAW.'
        }
    ]

    for o in orgs:
        existing = model.Group.by_name(o['name'])
        if existing and existing.is_organization:
            print(f"  - Organisasi '{o['name']}' sudah ada.")
        else:
            get_action('organization_create')(get_context(), o)
            print(f"  + Berhasil membuat Organisasi: {o['title']}")

def seed_datasets():
    print("\n[3/4] Menginisialisasi 6 Dataset Terbuka BMKG...")
    datasets = [
        {
            'name': 'cuaca-harian-cengkareng',
            'title': 'Data Observasi Cuaca Harian Permukaan Stasiun Soekarno-Hatta (WMO: 96749) Tahun 2026',
            'notes': 'Dataset time-series rekaman harian parameter atmosfer permukaan meliputi suhu minimum, suhu maksimum, suhu rata-rata, kelembapan nisbi udara, kecepatan angin maksimum, dan curah hujan harian terkalibrasi.',
            'owner_org': 'bbmkg-wilayah-2',
            'groups': [{'name': 'meteorologi'}],
            'tags': [{'name': 'cuaca'}, {'name': 'suhu'}, {'name': 'hujan'}, {'name': 'angin'}, {'name': 'stamet'}],
            'extras': [
                {'key': 'pilar_mkg', 'value': 'meteorologi'},
                {'key': 'id_stasiun_bmkg', 'value': '96749'},
                {'key': 'nama_stasiun', 'value': 'Stasiun Meteorologi Kelas I Soekarno-Hatta'},
                {'key': 'tipe_sensor', 'value': 'AWS (Automatic Weather Station)'},
                {'key': 'resolusi_temporal', 'value': 'Harian (Daily)'},
                {'key': 'cakupan_spasial', 'value': 'Titik Spesifik Stasiun'},
                {'key': 'waktu_mulai_observasi', 'value': '2026-08-01'},
                {'key': 'waktu_akhir_observasi', 'value': '2026-08-31'},
                {'key': 'standar_satuan', 'value': 'Derajat Celcius, Milimeter (mm), Knot'},
                {'key': 'wali_data_kontak', 'value': 'stamet.cengkareng@bmkg.go.id'},
                {'key': 'license_title', 'value': 'Creative Commons Attribution (CC-BY 4.0)'}
            ],
            'sample_file': 'sample_data/cuaca_harian_stamet_cengkareng.csv',
            'format': 'CSV',
            'resource_name': 'Data Observasi Cuaca Harian Permukaan Agustus 2026 (CSV)'
        },
        {
            'name': 'katalog-gempa-m5',
            'title': 'Katalog Riwayat Gempa Bumi Tektonik Magnitudo ≥ 5.0 Wilayah Indonesia Bulan Agustus 2026',
            'notes': 'Data geospasial titik episentrum, kedalaman sumber gempa, magnitudo, estimasi waktu penjalaran gelombang, dan status potensi ancaman tsunami di seluruh zona seismogenik dan subduksi lempeng nusantara.',
            'owner_org': 'deputi-geofisika',
            'groups': [{'name': 'geofisika'}],
            'tags': [{'name': 'gempa'}, {'name': 'seismik'}, {'name': 'tsunami'}, {'name': 'tews'}, {'name': 'magnitudo'}],
            'extras': [
                {'key': 'pilar_mkg', 'value': 'geofisika'},
                {'key': 'nama_stasiun', 'value': 'Jaringan Sensor Seismograf Broadband BMKG TEWS'},
                {'key': 'tipe_sensor', 'value': 'Seismograf Broadband'},
                {'key': 'resolusi_temporal', 'value': 'Harian (Daily)'},
                {'key': 'cakupan_spasial', 'value': 'Nasional (Seluruh RI)'},
                {'key': 'waktu_mulai_observasi', 'value': '2026-08-01'},
                {'key': 'waktu_akhir_observasi', 'value': '2026-08-15'},
                {'key': 'wali_data_kontak', 'value': 'pusat.gempa@bmkg.go.id'}
            ],
            'sample_file': 'sample_data/gempa_tektonik_m5_indonesia.geojson',
            'format': 'GeoJSON',
            'resource_name': 'Titik Episentrum Gempa Bumi Tektonik M5+ Agustus 2026 (GeoJSON)'
        },
        {
            'name': 'curah-hujan-dasarian',
            'title': 'Distribusi Curah Hujan Dasarian dan Analisis Sifat Hujan Nasional Periode 2026',
            'notes': 'Informasi akumulasi curah hujan per periode 10-harian (Dasarian I, II, III) dari seluruh jaringan pos hujan dan stasiun klimatologi BMKG, dilengkapi klasifikasi sifat hujan Atas Normal (AN), Normal (N), dan Bawah Normal (BN).',
            'owner_org': 'deputi-klimatologi',
            'groups': [{'name': 'klimatologi'}],
            'tags': [{'name': 'iklim'}, {'name': 'hujan'}, {'name': 'dasarian'}, {'name': 'kekeringan'}, {'name': 'staklim'}],
            'extras': [
                {'key': 'pilar_mkg', 'value': 'klimatologi'},
                {'key': 'tipe_sensor', 'value': 'ARG (Automatic Rain Gauge)'},
                {'key': 'resolusi_temporal', 'value': 'Dasarian (10 Harian)'},
                {'key': 'cakupan_spasial', 'value': 'Nasional (Seluruh RI)'},
                {'key': 'waktu_mulai_observasi', 'value': '2026-01-01'},
                {'key': 'waktu_akhir_observasi', 'value': '2026-08-31'},
                {'key': 'wali_data_kontak', 'value': 'iklim.terapan@bmkg.go.id'}
            ],
            'sample_file': None,
            'format': 'CSV',
            'resource_name': 'Akumulasi Curah Hujan Dasarian Nasional 2026 (CSV)'
        },
        {
            'name': 'kualitas-udara-pm25',
            'title': 'Konsentrasi Partikulat Atmosfer PM2.5 Per Jam Stasiun Kemayoran Jakarta Pusat 2026',
            'notes': 'Data pemantauan kualitas udara partikulat mikron PM2.5 per jam dengan baku mutu Environmental Protection Agency (EPA) dan BMKG, digunakan untuk analisis tren polusi udara dan indeks ISPU perkotaan.',
            'owner_org': 'gaw-kemayoran',
            'groups': [{'name': 'kualitas-udara'}],
            'tags': [{'name': 'kualitas-udara'}, {'name': 'pm25'}, {'name': 'polusi'}, {'name': 'kemayoran'}, {'name': 'gaw'}],
            'extras': [
                {'key': 'pilar_mkg', 'value': 'kualitas-udara'},
                {'key': 'id_stasiun_bmkg', 'value': '96745'},
                {'key': 'nama_stasiun', 'value': 'Stasiun Pemantau Atmosfer Global (GAW) Kemayoran'},
                {'key': 'tipe_sensor', 'value': 'SPKU PM2.5 Beta-Attenuation'},
                {'key': 'resolusi_temporal', 'value': 'Per Jam (Hourly)'},
                {'key': 'cakupan_spasial', 'value': 'Provinsi'},
                {'key': 'waktu_mulai_observasi', 'value': '2026-08-01'},
                {'key': 'waktu_akhir_observasi', 'value': '2026-08-31'},
                {'key': 'wali_data_kontak', 'value': 'gaw.kemayoran@bmkg.go.id'}
            ],
            'sample_file': None,
            'format': 'CSV',
            'resource_name': 'Konsentrasi Partikulat PM2.5 Per Jam Agustus 2026 (CSV)'
        },
        {
            'name': 'prakiraan-tinggi-gelombang',
            'title': 'Prakiraan Signifikan Tinggi Gelombang Perairan Laut Indonesia',
            'notes': 'Model prediksi tinggi gelombang laut maritim, arah dan kecepatan angin permukaan di zona pelayaran dan perikanan nusantara yang diperbarui setiap 6 jam untuk keselamatan transportasi laut.',
            'owner_org': 'deputi-meteorologi',
            'groups': [{'name': 'meteorologi'}],
            'tags': [{'name': 'maritim'}, {'name': 'gelombang'}, {'name': 'laut'}, {'name': 'pelayaran'}, {'name': 'netcdf'}],
            'extras': [
                {'key': 'pilar_mkg', 'value': 'meteorologi'},
                {'key': 'resolusi_temporal', 'value': 'Harian (Daily)'},
                {'key': 'cakupan_spasial', 'value': 'Nasional (Seluruh RI)'},
                {'key': 'wali_data_kontak', 'value': 'maritim@bmkg.go.id'}
            ],
            'sample_file': None,
            'format': 'NetCDF',
            'resource_name': 'Model WaveWatch III Tinggi Gelombang Laut (NetCDF)'
        },
        {
            'name': 'kerapatan-petir-jabar',
            'title': 'Kerapatan Sambaran Petir Cloud-to-Ground (CG) Wilayah Jawa Barat',
            'notes': 'Rekaman aktivitas sambaran petir harian tipe Cloud-to-Ground positif dan negatif di wilayah Provinsi Jawa Barat yang dipantau dari jaringan sensor Lightning Detector BMKG.',
            'owner_org': 'bbmkg-wilayah-2',
            'groups': [{'name': 'geofisika'}],
            'tags': [{'name': 'petir'}, {'name': 'lightning'}, {'name': 'geofisika'}, {'name': 'jawa-barat'}],
            'extras': [
                {'key': 'pilar_mkg', 'value': 'geofisika'},
                {'key': 'resolusi_temporal', 'value': 'Harian (Daily)'},
                {'key': 'cakupan_spasial', 'value': 'Provinsi'},
                {'key': 'wali_data_kontak', 'value': 'balai2@bmkg.go.id'}
            ],
            'sample_file': None,
            'format': 'CSV',
            'resource_name': 'Sebaran Kerapatan Petir CG Harian (CSV)'
        }
    ]

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    for d in datasets:
        pkg_name = d['name']
        sample_path = os.path.join(base_dir, d['sample_file']) if d.get('sample_file') else None
        
        existing = model.Package.by_name(pkg_name)
        if existing:
            print(f"  - Dataset '{pkg_name}' sudah ada (ID: {existing.id}).")
        else:
            pkg_data = {
                'name': pkg_name,
                'title': d['title'],
                'notes': d['notes'],
                'owner_org': d['owner_org'],
                'groups': d['groups'],
                'tags': d['tags'],
                'extras': d['extras'],
            }
            pkg = get_action('package_create')(get_context(), pkg_data)
            print(f"  + Berhasil membuat Dataset: {pkg['title']}")

            # Buat Resource
            res_data = {
                'package_id': pkg['id'],
                'name': d['resource_name'],
                'format': d['format'],
                'description': f"Berkas terbuka resmi {d['format']} terverifikasi BMKG.",
                'url': f"http://localhost:5000/dataset/{pkg_name}/resource/download"
            }

            if sample_path and os.path.exists(sample_path):
                res_data['url'] = f"/sample_data/{os.path.basename(sample_path)}"
            
            res = get_action('resource_create')(get_context(), res_data)
            print(f"    * Ditambahkan Resource: {res['name']} ({d['format']})")

            # Jika CSV cuaca, ingest ke DataStore!
            if pkg_name == 'cuaca-harian-cengkareng' and sample_path and os.path.exists(sample_path):
                ingest_datastore(res['id'], sample_path)

def ingest_datastore(resource_id, csv_file_path):
    print("    * Meng-ingest data CSV ke PostgreSQL DataStore...")
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            records = []
            for row in reader:
                record = {
                    'tanggal': row.get('tanggal', ''),
                    'stasiun_id': int(row.get('stasiun_id', 0)),
                    'nama_stasiun': row.get('nama_stasiun', ''),
                    'suhu_min': float(row.get('suhu_min', 0.0)),
                    'suhu_max': float(row.get('suhu_max', 0.0)),
                    'suhu_rata': float(row.get('suhu_rata', 0.0)),
                    'kelembapan_rata': float(row.get('kelembapan_rata', 0.0)),
                    'curah_hujan': float(row.get('curah_hujan', 0.0)),
                    'kecepatan_angin_max': float(row.get('kecepatan_angin_max', 0.0))
                }
                records.append(record)

        fields = [
            {'id': 'tanggal', 'type': 'text'},
            {'id': 'stasiun_id', 'type': 'int'},
            {'id': 'nama_stasiun', 'type': 'text'},
            {'id': 'suhu_min', 'type': 'float'},
            {'id': 'suhu_max', 'type': 'float'},
            {'id': 'suhu_rata', 'type': 'float'},
            {'id': 'kelembapan_rata', 'type': 'float'},
            {'id': 'curah_hujan', 'type': 'float'},
            {'id': 'kecepatan_angin_max', 'type': 'float'},
        ]

        get_action('datastore_create')(get_context(), {
            'resource_id': resource_id,
            'fields': fields,
            'records': records,
            'force': True
        })
        print(f"    * SUKSES: {len(records)} baris data cuaca berhasil di-ingest ke DataStore!")
    except Exception as e:
        print(f"    ! Catatan DataStore Ingest: {e}")

def main():
    print("====================================================================")
    print("  SEEDING BACKEND PORTAL OPEN DATA BMKG (CKAN 2.12)")
    print("====================================================================")
    config_path = os.environ.get('CKAN_INI', '/etc/ckan/default/ckan.ini')
    conf = load_config(config_path)
    make_app(conf)

    seed_groups()
    seed_organizations()
    seed_datasets()

    print("\n[4/4] Membangun Ulang Indeks Pencarian Apache Solr 9...")
    try:
        os.system("/usr/lib/ckan/default/bin/ckan -c /etc/ckan/default/ckan.ini search-index rebuild")
        print("  + Indeks Solr berhasil diperbarui!")
    except Exception as e:
        print(f"  ! Error rebuilding index: {e}")

    print("\n====================================================================")
    print("  SEEDING SELESAI: Backend CKAN telah terisi rapi & siap digunakan!")
    print("====================================================================")

if __name__ == '__main__':
    main()
