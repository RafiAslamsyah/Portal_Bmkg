/**
 * Portal Open Data BMKG — Modern Node.js Web Server (Pure JavaScript Engine)
 * File: ui_prototype/server.js
 * 
 * Menjalankan server aplikasi web Portal BMKG secara langsung tanpa memerlukan file HTML.
 * Seluruh halaman dirender dinamis dari index.js dan katalog.js.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Impor generator halaman dinamis JavaScript
const { renderIndexPage } = require('./index');
const { renderKatalogPage } = require('./katalog');

const PORT = process.env.PORT || 8080;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Normalisasi trailing slash jika bukan root
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // CORS Headers untuk API testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // =========================================================================
    // 1. RUTE HALAMAN UTAMA (BERANDA) -> DILAYANI DARI index.js
    // =========================================================================
    if (pathname === '/' || pathname === '/index' || pathname === '/index.html' || pathname === '/index.js') {
      try {
        const html = renderIndexPage();
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(html);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error saat merender index.js: ' + err.message);
        return;
      }
    }

    // =========================================================================
    // 2. RUTE KATALOG DATASET -> DILAYANI DARI katalog.js
    // =========================================================================
    if (pathname === '/katalog' || pathname === '/katalog.html' || pathname === '/katalog.js') {
      try {
        const html = renderKatalogPage();
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(html);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error saat merender katalog.js: ' + err.message);
        return;
      }
    }

    // =========================================================================
    // 3. MOCK API CKAN (Agar fitur live search & datastore berfungsi offline)
    // =========================================================================
    if (pathname === '/api/3/action/package_search') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        result: {
          count: 148,
          results: []
        }
      }));
      return;
    }

    if (pathname === '/api/3/action/datastore_search') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        result: {
          resource_id: parsedUrl.query.resource_id || 'cuaca-harian-cengkareng-2026',
          records: [
            { tanggal: "2026-08-01", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.2, suhu_max: 32.8, suhu_rata: 28.5, kelembapan: 78, curah_hujan: 0.0 },
            { tanggal: "2026-08-02", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.0, suhu_max: 33.2, suhu_rata: 28.9, kelembapan: 76, curah_hujan: 0.0 },
            { tanggal: "2026-08-03", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 23.8, suhu_max: 32.0, suhu_rata: 27.8, kelembapan: 82, curah_hujan: 14.5 },
            { tanggal: "2026-08-04", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.4, suhu_max: 31.5, suhu_rata: 27.2, kelembapan: 85, curah_hujan: 32.0 },
            { tanggal: "2026-08-05", stasiun_id: "96749", nama_stasiun: "Stasiun Meteorologi Soekarno-Hatta", suhu_min: 24.6, suhu_max: 33.0, suhu_rata: 28.6, kelembapan: 79, curah_hujan: 4.2 },
            { tanggal: "2026-08-06", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 25.0, suhu_max: 33.5, suhu_rata: 29.1, kelembapan: 74, curah_hujan: 0.0 },
            { tanggal: "2026-08-07", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 24.8, suhu_max: 34.0, suhu_rata: 29.4, kelembapan: 72, curah_hujan: 0.0 },
            { tanggal: "2026-08-08", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 25.2, suhu_max: 33.8, suhu_rata: 29.5, kelembapan: 75, curah_hujan: 0.0 },
            { tanggal: "2026-08-09", stasiun_id: "96745", nama_stasiun: "Stasiun Meteorologi Kemayoran", suhu_min: 24.6, suhu_max: 32.4, suhu_rata: 28.2, kelembapan: 80, curah_hujan: 8.4 },
            { tanggal: "2026-08-10", stasiun_id: "96739", nama_stasiun: "Stasiun Klimatologi Banten", suhu_min: 23.5, suhu_max: 31.8, suhu_rata: 27.6, kelembapan: 84, curah_hujan: 21.0 }
          ]
        }
      }));
      return;
    }

    // =========================================================================
    // 4. STATIS ASSETS (MODUL JS, LOGO, CSS, DLL)
    // =========================================================================
    const safePath = path.normalize(pathname).replace(/^(..[\/])+/, '');
    const filePath = path.join(BASE_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + pathname);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'public, max-age=3600'
      });

      fs.createReadStream(filePath).pipe(res);
    });
  });
}

function startServer(port = PORT, initialPath = '') {
  const server = createServer();
  server.listen(port, () => {
    console.log('====================================================================');
    console.log('  PORTAL OPEN DATA BMKG - JAVASCRIPT SERVER BERJALAN');
    console.log('====================================================================');
    console.log('  Aplikasi kini murni ditenagai berkas JavaScript (.js) tanpa file HTML!');
    console.log(`  - Beranda Utama   : http://localhost:${port}/`);
    console.log(`  - Katalog Dataset : http://localhost:${port}/katalog`);
    console.log('====================================================================');
  });
  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = { createServer, startServer };
