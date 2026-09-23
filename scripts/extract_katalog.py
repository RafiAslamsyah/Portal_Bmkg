with open('ckanext-bmkg/ckanext/bmkg/templates/katalog.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

clean_lines = []
for line in lines[1:]:
    if line.startswith('======='):
        break
    clean_lines.append(line)

content = ''.join(clean_lines)

snippet = """
    // Parse URL parameters for q and pilar
    function initUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      const pilar = urlParams.get('pilar');
      let shouldFilter = false;

      if (q) {
        const searchEl = document.getElementById('catalogSearchInput');
        if (searchEl) {
          searchEl.value = q;
          shouldFilter = true;
        }
      }

      if (pilar) {
        const pilarCb = document.querySelector(`.facet-pilar[value="${pilar}"]`);
        if (pilarCb) {
          pilarCb.checked = true;
          shouldFilter = true;
        }
      }

      if (shouldFilter) {
        applyFilterAndSearch();
      }
    }
    initUrlParams();
"""

content = content.replace('initRealtimeClock();', 'initRealtimeClock();\n' + snippet)

with open('ui_prototype/katalog.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully generated ui_prototype/katalog.html ({len(content)} chars)")

