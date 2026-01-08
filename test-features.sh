#!/bin/bash
echo "🧪 TESTING FLEET APP FEATURES"
echo "================================"

# Test main app
echo -e "\n[1/5] Testing Main App..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/

# Test 3D garage
echo -e "\n[2/5] Testing 3D Garage..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/test-3d-garage.html

# Test force maps
echo -e "\n[3/5] Testing Google Maps..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/force-google-maps.html

# Test service worker
echo -e "\n[4/5] Testing Service Worker..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/sw.js

# Test assets
echo -e "\n[5/5] Testing Assets..."
curl -s http://localhost:8080 | grep -o 'assets/[^"]*' | head -5 | while read asset; do
  curl -s -o /dev/null -w "$asset: %{http_code}\n" "http://localhost:8080/$asset"
done

echo -e "\n✅ Feature Testing Complete"
