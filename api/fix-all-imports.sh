#!/bin/bash

cd /Users/andrewmorton/Documents/GitHub/Fleet/api

echo "Fixing all import paths..."

# Fix authMiddleware -> auth or azure-ad-auth
find src/routes -name "*.ts" -exec sed -i '' "s/from '\.\.\/middleware\/authMiddleware'/from '..\/middleware\/azure-ad-auth'/g" {} \;

# Fix role.middleware -> rbac
find src/routes -name "*.ts" -exec sed -i '' "s/from '\.\.\/middleware\/role\.middleware'/from '..\/middleware\/rbac'/g" {} \;

# Fix utils/async-handler -> middleware/async-handler  
find src/routes -name "*.ts" -exec sed -i '' "s/from '\.\.\/utils\/async-handler'/from '..\/middleware\/async-handler'/g" {} \;

# Fix checkRole -> requireRole
find src/routes -name "*.ts" -exec sed -i '' "s/checkRole/requireRole/g" {} \;

echo "✅ Import fixes complete"
