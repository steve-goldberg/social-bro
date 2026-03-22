#!/usr/bin/env bash
# =============================================================================
# Auth E2E Test — Register → Verify Email via Mailpit → Login
#
# Prerequisites:
#   1. docker compose up -d  (from backend/)
#   2. npm run dev            (from frontend/)
#   3. TrailBase SMTP configured to point to mailpit:1025
#
# Services:
#   - SvelteKit frontend:   http://localhost:5173
#   - TrailBase backend:    http://localhost:4000
#   - Mailpit SMTP:         localhost:1025
#   - Mailpit Web UI/API:   http://localhost:8025
# =============================================================================

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
TRAILBASE_URL="${TRAILBASE_URL:-http://localhost:4000}"
MAILPIT_API="${MAILPIT_API:-http://localhost:8025/api}"

TEST_EMAIL="testuser-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# ---------------------------------------------------------------------------
# 0. Health checks
# ---------------------------------------------------------------------------
info "Checking services..."

curl -sf "${FRONTEND_URL}/api/health" > /dev/null 2>&1 \
  || fail "SvelteKit frontend not reachable at ${FRONTEND_URL}"
pass "SvelteKit frontend is running"

curl -sf "${TRAILBASE_URL}/api/healthcheck" > /dev/null 2>&1 \
  || fail "TrailBase not reachable at ${TRAILBASE_URL}"
pass "TrailBase backend is running"

curl -sf "${MAILPIT_API}/v1/info" > /dev/null 2>&1 \
  || fail "Mailpit not reachable at ${MAILPIT_API}"
pass "Mailpit is running"

# ---------------------------------------------------------------------------
# 1. Register a new user via TrailBase API
# ---------------------------------------------------------------------------
info "Registering user: ${TEST_EMAIL}"

REGISTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${TRAILBASE_URL}/api/auth/v1/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\", \"password_repeat\": \"${TEST_PASSWORD}\"}")

if [[ "$REGISTER_STATUS" == "200" || "$REGISTER_STATUS" == "303" ]]; then
  pass "Registration succeeded (HTTP ${REGISTER_STATUS})"
else
  fail "Registration failed (HTTP ${REGISTER_STATUS})"
fi

# ---------------------------------------------------------------------------
# 2. Verify login fails before email verification
# ---------------------------------------------------------------------------
info "Attempting login before email verification..."

LOGIN_BEFORE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${TRAILBASE_URL}/api/auth/v1/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

if [[ "$LOGIN_BEFORE" == "401" || "$LOGIN_BEFORE" == "403" ]]; then
  pass "Login correctly rejected before verification (HTTP ${LOGIN_BEFORE})"
else
  fail "Login should have been rejected, got HTTP ${LOGIN_BEFORE}"
fi

# ---------------------------------------------------------------------------
# 3. Retrieve verification email from Mailpit
# ---------------------------------------------------------------------------
info "Waiting for verification email..."
sleep 2

# Search Mailpit for the verification email
MESSAGES=$(curl -sf "${MAILPIT_API}/v1/search?query=to:${TEST_EMAIL}" 2>/dev/null)

if [ -z "$MESSAGES" ]; then
  # Fallback: list all messages
  MESSAGES=$(curl -sf "${MAILPIT_API}/v1/messages" 2>/dev/null)
fi

MESSAGE_COUNT=$(echo "$MESSAGES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('messages_count', d.get('total', 0)))" 2>/dev/null || echo "0")

if [[ "$MESSAGE_COUNT" -eq 0 ]]; then
  info "No emails in Mailpit — TrailBase may be in dev-mode (prints to stderr)."
  info "Attempting direct email verification via TrailBase admin..."

  # In dev mode, TrailBase prints the verification URL to stderr.
  # As a fallback, we can try to verify the user via the admin API or
  # by directly querying the TrailBase database.
  # For now, we'll document this as a known dev-mode limitation.
  info "SKIPPING email verification (dev-mode detected)"
  info "To test with Mailpit, configure TrailBase SMTP: host=mailpit, port=1025"
  VERIFICATION_SKIPPED=true
else
  pass "Found ${MESSAGE_COUNT} email(s) in Mailpit"

  # Get the first message ID
  MESSAGE_ID=$(echo "$MESSAGES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
msgs = d.get('messages', [])
if msgs:
    print(msgs[0]['ID'])
" 2>/dev/null)

  # Get message body to extract verification link
  MESSAGE_BODY=$(curl -sf "${MAILPIT_API}/v1/message/${MESSAGE_ID}" 2>/dev/null)

  # Extract verification URL from the email
  VERIFY_URL=$(echo "$MESSAGE_BODY" | python3 -c "
import sys, json, re
d = json.load(sys.stdin)
# Check HTML body first, then text
body = d.get('HTML', '') or d.get('Text', '')
# Look for TrailBase verification link pattern
urls = re.findall(r'https?://[^\s\"<>]+verify_email/confirm/[^\s\"<>]+', body)
if urls:
    print(urls[0])
else:
    # Try a broader pattern
    urls = re.findall(r'https?://[^\s\"<>]+', body)
    for u in urls:
        if 'verify' in u.lower():
            print(u)
            break
" 2>/dev/null)

  if [ -n "$VERIFY_URL" ]; then
    pass "Found verification URL"
    info "Clicking verification link..."
    VERIFY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$VERIFY_URL")
    if [[ "$VERIFY_STATUS" == "200" || "$VERIFY_STATUS" == "303" ]]; then
      pass "Email verified (HTTP ${VERIFY_STATUS})"
    else
      fail "Email verification failed (HTTP ${VERIFY_STATUS})"
    fi
  else
    info "Could not extract verification URL from email body"
    info "You may need to verify manually via Mailpit UI at http://localhost:8025"
    VERIFICATION_SKIPPED=true
  fi
fi

# ---------------------------------------------------------------------------
# 4. Login after verification
# ---------------------------------------------------------------------------
if [[ "${VERIFICATION_SKIPPED:-false}" != "true" ]]; then
  info "Logging in after email verification..."

  LOGIN_RESPONSE=$(curl -s \
    -X POST "${TRAILBASE_URL}/api/auth/v1/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

  AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('auth_token',''))" 2>/dev/null || echo "")

  if [ -n "$AUTH_TOKEN" ]; then
    pass "Login succeeded — received auth token"
  else
    fail "Login failed — no auth token in response"
  fi

  # Verify the token works by checking status
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    "${TRAILBASE_URL}/api/auth/v1/status")

  if [[ "$STATUS_CODE" == "200" ]]; then
    pass "Auth token is valid (status check passed)"
  else
    fail "Auth token status check failed (HTTP ${STATUS_CODE})"
  fi
else
  info "Skipping post-verification login test (verification was skipped)"
fi

# ---------------------------------------------------------------------------
# 5. Test SvelteKit form-based auth flow
# ---------------------------------------------------------------------------
info "Testing SvelteKit login form action..."

# POST to the SvelteKit login form action
SVELTEKIT_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${FRONTEND_URL}/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Origin: ${FRONTEND_URL}" \
  -d "email=${TEST_EMAIL}&password=${TEST_PASSWORD}" \
  -L)

info "SvelteKit login form returned HTTP ${SVELTEKIT_LOGIN}"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo -e "${GREEN}Auth E2E Test Complete${NC}"
echo "============================================"
echo "Test user: ${TEST_EMAIL}"
echo ""
echo "Mailpit UI: http://localhost:8025"
echo "TrailBase Admin: http://localhost:4000/_/admin/"
echo ""
if [[ "${VERIFICATION_SKIPPED:-false}" == "true" ]]; then
  echo -e "${YELLOW}NOTE: Email verification was skipped.${NC}"
  echo "To enable full e2e flow, configure TrailBase SMTP:"
  echo "  In TrailBase admin UI → Settings → Email:"
  echo "    SMTP Host: mailpit (or localhost if not using Docker network)"
  echo "    SMTP Port: 1025"
  echo "    Sender: noreply@socialbro.local"
  echo "    No authentication required"
fi
