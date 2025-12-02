#!/bin/bash
set -e

echo "🔧 Applying Fleet white screen fixes..."
echo ""

# Fix 1: Error Boundary
echo "1️⃣ Fixing Error Boundary (src/ErrorFallback.tsx)..."
cat > src/ErrorFallback.tsx << 'EOF'
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Always show the error boundary - helps diagnose issues
  console.error('[ErrorFallback] Caught error:', error);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>A runtime error has occurred</AlertTitle>
          <AlertDescription>
            Something unexpected happened. The error details are shown below.
          </AlertDescription>
        </Alert>

        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Error Details:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
          <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border overflow-auto max-h-32 mt-2">
            {error.stack}
          </pre>
        </div>

        <Button
          onClick={resetErrorBoundary}
          className="w-full"
          variant="outline"
        >
          <RefreshCwIcon />
          Try Again
        </Button>
      </div>
    </div>
  );
}
EOF
echo "   ✅ Error boundary fixed"

# Fix 2: Create .env
echo ""
echo "2️⃣ Creating .env file..."
if [ -f .env ]; then
  echo "   ⚠️  .env already exists, creating .env.new instead"
  ENV_FILE=".env.new"
else
  ENV_FILE=".env"
fi

cat > "$ENV_FILE" << 'EOF'
# ===========================================
# Fleet Management System - Environment Variables
# ===========================================

# Frontend (Vite)
VITE_API_URL=
VITE_ENVIRONMENT=development

# Azure AD Authentication (Use test/demo values or configure real ones)
VITE_AZURE_AD_CLIENT_ID=demo-client-id
VITE_AZURE_AD_TENANT_ID=demo-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Azure Maps (Optional - leave empty to disable maps)
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=false
VITE_ENABLE_TEAMS_INTEGRATION=false
VITE_ENABLE_EMAIL_CENTER=false
VITE_ENABLE_DARK_MODE=true

# Application Insights (Optional)
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=
EOF
echo "   ✅ Environment file created: $ENV_FILE"

# Fix 3: Script paths in index.html
echo ""
echo "3️⃣ Fixing script paths in index.html..."
# Create backup
cp index.html index.html.bak
# Remove the CSS link
sed -i.tmp '/<link href="\.\/src\/main\.css" rel="stylesheet" \/>/d' index.html
# Fix script paths
sed -i.tmp 's|src="./runtime-config.js"|src="/runtime-config.js"|g' index.html
sed -i.tmp 's|src="./react-polyfill.js"|src="/react-polyfill.js"|g' index.html
rm -f index.html.tmp
echo "   ✅ Script paths fixed (backup saved as index.html.bak)"

# Fix 4: Clean build artifacts
echo ""
echo "4️⃣ Cleaning build artifacts..."
rm -rf dist/ node_modules/.vite
echo "   ✅ Build artifacts cleaned"

echo ""
echo "════════════════════════════════════════════════"
echo "✅ All fixes applied successfully!"
echo "════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "   1. Review the .env file and add real Azure AD credentials if needed"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:5173"
echo ""
echo "📄 Full diagnostic report: WHITE_SCREEN_DIAGNOSTIC_REPORT.md"
echo ""
