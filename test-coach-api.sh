#!/bin/bash

# Script de test pour l'API Coach
# Usage: ./test-coach-api.sh [endpoint]

API_BASE="https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api"
API_KEY="f0b95ce832383809116f190cbcb51c369e1dcd563ef89398f7a561dbec4809dc"

# Remplace par ton user_id Supabase (voir console de l'app ou supabase dashboard)
USER_ID="YOUR_USER_ID_HERE"

ENDPOINT="${1:-motivation}"

echo "🤖 Test de l'API Coach - Endpoint: /$ENDPOINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -X GET \
  "${API_BASE}/${ENDPOINT}?user_id=${USER_ID}" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test terminé"
echo ""
echo "Endpoints disponibles:"
echo "  - habits      (liste complète des habitudes)"
echo "  - stats       (statistiques globales)"
echo "  - today       (état du jour)"
echo "  - motivation  (message de motivation)"

