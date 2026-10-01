/**
 * Portal Open Data BMKG — Komponen Tampilan Front-End (edit_base)
 * Dikonversi murni dari: ckanext-bmkg\ckanext\bmkg\templates\user\edit_base.html ke JavaScript (.js)
 */

function renderEditBase(context = {}) {
  return `{% extends "page.html" %}

{% block subtitle %}{{ _('Manage') }} — Portal Data BMKG{% endblock %}

{% block content %}
<div class="user-page-wrapper">
  {% block primary_content %}
    <div class="user-layout-container">
      <div class="user-main-col">
        {% block primary_content_inner %}{% endblock %}
      </div>
      <aside class="user-sidebar-col">
        {% block secondary_content %}{% endblock %}
      </aside>
    </div>
  {% endblock %}
</div>
{% endblock %}
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = renderEditBase;
  module.exports.renderEditBase = renderEditBase;
  module.exports.default = renderEditBase;
}
