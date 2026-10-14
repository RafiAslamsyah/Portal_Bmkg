import urllib.request
import json

url = 'http://localhost:5000/api/3/action/package_search?rows=50'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

results = data.get('result', {}).get('results', [])
print(f"Total datasets in CKAN: {len(results)}")
for p in results:
    res_list = [f"{r.get('name', 'unnamed')} ({r.get('format', 'unknown')}) -> {r.get('url', '')}" for r in p.get('resources', [])]
    print(f"- {p.get('name')}: {res_list}")
