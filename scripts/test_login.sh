#!/bin/bash
# Test CKAN login flow
PORT="${CKAN_PORT:-5000}"
BASE_URL="${CKAN_BASE_URL:-http://localhost:${PORT}}"

# Step 1: Get login page and extract CSRF token + cookie
COOKIE_FILE=/tmp/test_login_cookies.txt
rm -f "$COOKIE_FILE"

echo "=== Step 1: GET /user/login ==="
RESPONSE=$(curl -s -c "$COOKIE_FILE" http://localhost:8080/user/login)
echo "=== Step 1: GET /user/login on ${BASE_URL} ==="
RESPONSE=$(curl -s -c "$COOKIE_FILE" "${BASE_URL}/user/login")
CSRF_TOKEN=$(echo "$RESPONSE" | grep -oP 'name="_csrf_token" value="\K[^"]+' | head -1)
echo "CSRF token: ${CSRF_TOKEN:0:50}..."
echo "Cookies saved to $COOKIE_FILE"
cat "$COOKIE_FILE"

echo ""
echo "=== Step 2: POST /user/login ==="
LOGIN_RESPONSE=$(curl -s -v -b "$COOKIE_FILE" -c "$COOKIE_FILE" -L \
  -d "login=admin" \
  -d "password=AdminBMKG2026!" \
  -d "_csrf_token=$CSRF_TOKEN" \
  -d "came_from=http://localhost:8080/" \
  http://localhost:8080/user/login 2>&1)
  -d "came_from=${BASE_URL}/" \
  "${BASE_URL}/user/login" 2>&1)

echo "$LOGIN_RESPONSE" | grep -iE '< HTTP|< location|< set-cookie|error|alert|flash|Login failed|berhasil|Invalid'

echo ""
echo "=== Step 3: Check if logged in ==="
DASHBOARD=$(curl -s -b "$COOKIE_FILE" http://localhost:8080/dashboard/)
DASHBOARD=$(curl -s -b "$COOKIE_FILE" "${BASE_URL}/dashboard/")
echo "$DASHBOARD" | grep -oP '(logged_in|admin|dashboard|Selamat|Halo|user-image|class="username"|Logout|Keluar)[^<]*' | head -10

echo ""
echo "=== Final cookies ==="
cat "$COOKIE_FILE"

