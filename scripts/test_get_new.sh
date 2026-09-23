#!/bin/bash
COOKIE=/tmp/ckan_admin_cookie.txt
rm -f $COOKIE
CSRF=$(curl -s -c $COOKIE http://127.0.0.1:5000/user/login | grep -oP 'name="_csrf_token" value="\K[^"]+' | head -1)
curl -s -b $COOKIE -c $COOKIE -d "login=admin" -d "password=AdminBMKG2026!" -d "_csrf_token=$CSRF" http://127.0.0.1:5000/user/login > /dev/null
curl -s -b $COOKIE http://127.0.0.1:5000/dataset/new > /tmp/rendered_new_dataset.html
echo "Lines: $(wc -l < /tmp/rendered_new_dataset.html)"
grep -E '<form|<h1|class="stage' /tmp/rendered_new_dataset.html
