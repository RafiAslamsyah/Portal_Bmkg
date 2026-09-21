# ckanext-bmkg

Ekstensi resmi CKAN untuk **Portal Open Data BMKG**.
Menyediakan tema visual berstandar *Satu Data Indonesia*, skema metadata khusus 4 pilar MKG (Meteorologi, Klimatologi, Geofisika, Kualitas Udara), dan helper plugin institusi BMKG.

## Struktur Direktori

```text
ckanext-bmkg/
├── ckanext/
│   └── bmkg/
│       ├── __init__.py
│       ├── plugin.py               # Entrypoint CKAN Plugin (IConfigurer, ITemplateHelpers, IPackageController, IFacets)
│       ├── helpers.py              # Helper fungsi tampilan & format data MKG
│       ├── schemas/                # Skema metadata 4 pilar MKG
│       │   └── bmkg_dataset.json
│       ├── templates/              # Jinja2 template overriding tema Satu Data BMKG
│       │   ├── base.html
│       │   ├── header.html
│       │   ├── footer.html
│       │   ├── home/
│       │   │   └── index.html      # Hero banner, statistik dataset, 4 pilar cards
│       │   ├── package/
│       │   │   ├── read.html       # Halaman detail dataset MKG
│       │   │   └── search.html     # Halaman pencarian dataset & spatial filter
│       │   └── snippets/
│       │       └── spatial_query.html
│       └── public/                 # Static assets (CSS, JS, ikon)
│           ├── css/
│           │   └── bmkg-theme.css  # Styling Satu Data BMKG
│           ├── js/
│           │   └── bmkg-spatial.js # Integrasi Leaflet & helper peta
│           └── img/
│               └── logo-bmkg.png
├── setup.py                        # Konfigurasi instalasi Python package & CKAN entry points
├── setup.cfg
├── MANIFEST.in
└── README.md
```

## Instalasi Pengembangan (Lokal / WSL2)

Pastikan virtual environment CKAN aktif:
```bash
source /usr/lib/ckan/default/bin/activate
cd /usr/lib/ckan/default/src/ckanext-bmkg
pip install -e .
```

Tambahkan plugin ke `ckan.ini`:
```ini
ckan.plugins = bmkg_theme bmkg_schema stats text_view image_view datastore datapusher_plus spatial_metadata spatial_query geo_view geojson_view
```
