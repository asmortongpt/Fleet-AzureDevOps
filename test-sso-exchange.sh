#!/bin/bash
# Test the SSO token exchange endpoint directly

echo "🧪 Testing SSO Token Exchange Endpoint"
echo "======================================"
echo ""

# Test with a mock ID token payload (this is what Microsoft sends)
MOCK_ID_TOKEN='eyJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJiYWFlMDg1MS0wYzI0LTQyMTQtODU4Ny1lM2ZhYmM0NmJkNGEiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vMGVjMTRiODEtN2I4Mi00NWVlLThmM2QtY2JjMzFjZWQ1MzQ3L3YyLjAiLCJpYXQiOjE3MDk2NzQwMDAsImV4cCI6MTcwOTY3NzcwMCwibmFtZSI6IkFuZHJldyBNb3J0b24iLCJvaWQiOiJmZjRjMzEzZi01NzVhLTQ5ZjItODFhMC1jMjY4MjNlN2QwODQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhbmRyZXcubUBjYXBpdGFsdGVjaGFsbGlhbmNlLmNvbSIsImVtYWlsIjoiYW5kcmV3Lm1AY2FwaXRhbHRlY2hhbGxpYW5jZS5jb20iLCJ0aWQiOiIwZWMxNGI4MS03YjgyLTQ1ZWUtOGYzZC1jYmMzMWNlZDUzNDciLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBIn0.mock_signature'

echo "📤 Sending test exchange request to http://localhost:3001/api/auth/microsoft/exchange"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:3001/api/auth/microsoft/exchange \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5174" \
  -d "{
    \"idToken\": \"$MOCK_ID_TOKEN\",
    \"accessToken\": \"mock_access_token\"
  }")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📥 Response Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ SUCCESS! Token exchange completed"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "🎉 SSO authentication flow is WORKING!"
else
  echo "❌ FAILED with status $HTTP_STATUS"
  echo ""
  echo "Error Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""

  # Check if it's the provider column error
  if echo "$BODY" | grep -q "provider.*does not exist"; then
    echo "🔍 Database schema issue detected - checking..."
    psql -h localhost -U andrewmorton -d fleet_db -c "\d users" | grep provider
  fi
fi
