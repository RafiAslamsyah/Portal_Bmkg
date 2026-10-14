import urllib.request
import json
import re
from datetime import datetime, timezone, timedelta

def fetch_bmkg_realtime():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
    }
    req = urllib.request.Request('https://www.bmkg.go.id/gempabumi/gempabumi-realtime', headers=headers)
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
    
    m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        return []
    
    data = json.loads(m.group(1))
    def resolve(val):
        if isinstance(val, int) and 0 <= val < len(data):
            return data[val]
        return val

    events = []
    for item in data:
        if isinstance(item, dict) and 'eventid' in item and 'mag' in item:
            try:
                eventid = resolve(item.get('eventid'))
                waktu_str = resolve(item.get('waktu'))
                lat = float(resolve(item.get('lintang')))
                lon = float(resolve(item.get('bujur')))
                dalam = resolve(item.get('dalam'))
                mag = float(resolve(item.get('mag')))
                area = resolve(item.get('area'))
                status = resolve(item.get('status'))

                # Convert UTC to WIB (+7)
                # waktu_str format e.g. "2026/10/14  01:01:38.150"
                try:
                    clean_w = ' '.join(str(waktu_str).split())
                    dt_utc = datetime.strptime(clean_w.split('.')[0], '%Y/%m/%d %H:%M:%S')
                    dt_wib = dt_utc + timedelta(hours=7)
                    tanggal_wib = dt_wib.strftime('%d %b %Y %H:%M:%S WIB')
                    jam_wib = dt_wib.strftime('%H:%M:%S WIB')
                except Exception:
                    tanggal_wib = str(waktu_str)
                    jam_wib = ''

                events.append({
                    'id': str(eventid),
                    'mag': mag,
                    'kedalaman': f"{dalam} km" if isinstance(dalam, (int, float)) else str(dalam),
                    'lat': lat,
                    'lon': lon,
                    'tanggal': tanggal_wib,
                    'jam': jam_wib,
                    'wilayah': str(area) if area else 'Wilayah Indonesia',
                    'status': 'Dikonfirmasi Seismolog' if status == 'confirmed' else 'Deteksi Otomatis Real-time',
                    'dirasakan': '',
                    'shakemap': None,
                    'isLatestLive': False,
                    'kategori': 'm5' if mag >= 5.0 else ('mikro' if mag < 3.0 else 'm3')
                })
            except Exception:
                continue

    if events:
        events[0]['isLatestLive'] = True
    return events

if __name__ == '__main__':
    items = fetch_bmkg_realtime()
    print(f"Total events parsed: {len(items)}")
    if items:
        print("Top 1 event:", json.dumps(items[0], indent=2))
