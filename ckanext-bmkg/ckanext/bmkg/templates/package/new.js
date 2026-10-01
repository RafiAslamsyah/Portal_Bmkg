/**
 * Portal Open Data BMKG — Komponen Tampilan Front-End (new)
 * Dikonversi murni dari: ckanext-bmkg\ckanext\bmkg\templates\package\new.html ke JavaScript (.js)
 */

function renderNew(context = {}) {
  return `{% extends "package/base_form_page.html" %}

{% block subtitle %}Tambah Dataset Baru — Portal Data BMKG{% endblock %}
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = renderNew;
  module.exports.renderNew = renderNew;
  module.exports.default = renderNew;
}
