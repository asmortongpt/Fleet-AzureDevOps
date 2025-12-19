#!/usr/bin/env tsx
/**
 * Mobile Asset QR Builder Agent
 * Builds mobile-first asset check-in/out system with QR scanning and photo uploads
 */

import fs from 'fs/promises';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are an expert mobile-first full-stack engineer.

Create a COMPLETE, PRODUCTION-READY mobile asset management system with these EXACT requirements:

## MANDATORY REQUIREMENTS:

### 1. SECURITY (Critical - Government/Enterprise):
- JWT RS256 authentication
- Parameterized SQL queries ONLY: pool.query('SELECT * FROM assets WHERE id = $1', [id])
- Verify user permissions before checkout/checkin
- Validate GPS coordinates (lat: -90 to 90, lng: -180 to 180)
- Scan uploaded photos for metadata (strip EXIF data)
- Rate limiting: 10 checkouts/minute per user
- Multi-tenant isolation

### 2. MOBILE-FIRST DESIGN:
- Touch-friendly UI (44px+ tap targets)
- Responsive layout (works on phones, tablets)
- PWA-ready (offline capability via Service Worker)
- Fast photo uploads (stream, don't buffer in memory)
- QR code generation: SVG format, 300x300px

### 3. PERFORMANCE:
- Photo compression: WebP format, max 2MB
- Generate thumbnails: 150x150px for list views
- Azure Blob Storage for photo hosting
- Cache QR codes (1 hour TTL)
- Lazy load images in list views

### 4. ERROR HANDLING:
- Try/catch on ALL async operations
- Retry photo uploads (3 attempts with exponential backoff)
- User-friendly error messages
- Log all errors to monitoring service
- Handle offline mode gracefully

### 5. TYPESCRIPT STRICT MODE:
- Full type coverage
- No 'any' types
- Zod schema validation
- Exported TypeScript interfaces

### 6. FEATURES:
- QR code generation with embedded asset ID + tenant ID
- Photo upload with compression
- GPS location recording
- Digital signature capture (base64)
- Condition rating (1-5 stars)
- Checkout history tracking
- Offline request queuing (IndexedDB)

Generate COMPLETE files (not snippets):
1. api/src/routes/assets-mobile.routes.ts (Checkout/checkin endpoints)
2. api/src/services/qr-generator.service.ts (QR code generation)
3. api/src/services/photo-storage.service.ts (Azure Blob + compression)
4. api/migrations/021_asset_checkout_history.sql (Database schema)
5. src/components/mobile/AssetCheckInOut.tsx (React component)

Return ONLY valid TypeScript/SQL code. No explanations.`;

interface FileOutput {
  path: string;
  content: string;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content
    .replace(/^```(?:typescript|sql|tsx)\n/gm, '')
    .replace(/\n```$/g, '');
}

async function buildFile(fileDescription: string, fileName: string): Promise<FileOutput> {
  console.log(`\n🔨 Building: ${fileName}`);

  const prompt = `Generate the complete ${fileDescription} file.

File: ${fileName}

Requirements:
- Full implementation, not a stub
- All imports at the top
- Proper error handling
- TypeScript strict mode
- Security best practices (parameterized queries, input validation)
- Mobile-optimized UI (if React component)
- Comprehensive JSDoc comments

Return ONLY the file content, no explanations.`;

  try {
    const content = await generateWithOpenAI(prompt);
    console.log(`✅ Generated: ${fileName} (${content.length} chars)`);
    return { path: fileName, content };
  } catch (error: any) {
    console.error(`❌ Failed to generate ${fileName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('========================================');
  console.log('Mobile Asset QR Builder Agent');
  console.log('========================================\n');

  const files: FileOutput[] = [];

  try {
    // File 1: Mobile Routes
    files.push(await buildFile(
      'API routes for asset checkout/checkin with photo upload',
      'api/src/routes/assets-mobile.routes.ts'
    ));

    // File 2: QR Generator Service
    files.push(await buildFile(
      'QR code generation service (SVG format, embed asset ID + tenant ID)',
      'api/src/services/qr-generator.service.ts'
    ));

    // File 3: Photo Storage Service
    files.push(await buildFile(
      'Photo storage service (Azure Blob, WebP compression, thumbnail generation)',
      'api/src/services/photo-storage.service.ts'
    ));

    // File 4: Database Migration
    files.push(await buildFile(
      'SQL migration for asset_checkout_history table with GPS and photos',
      'api/migrations/021_asset_checkout_history.sql'
    ));

    // File 5: React Component
    files.push(await buildFile(
      'React component for mobile asset check-in/out with QR scanner and camera',
      'src/components/mobile/AssetCheckInOut.tsx'
    ));

    // Write all files
    console.log('\n========================================');
    console.log('Writing files to disk...');
    console.log('========================================\n');

    for (const file of files) {
      const fullPath = path.join('/home/azureuser/fleet-local', file.path);
      const dir = path.dirname(fullPath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf-8');

      console.log(`✅ Wrote: ${file.path}`);
    }

    console.log('\n========================================');
    console.log('Mobile Asset QR Builder - COMPLETE!');
    console.log('========================================');
    console.log(`✅ Generated ${files.length} files`);
    console.log('\nNext steps:');
    console.log('1. Review generated files');
    console.log('2. Run database migration: cd api && npm run migrate');
    console.log('3. Install dependencies: npm install qrcode sharp @azure/storage-blob multer');
    console.log('4. Set env vars: AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY');
    console.log('5. Test checkout: curl -X POST http://localhost:3000/api/assets/123/checkout');

  } catch (error: any) {
    console.error('\n❌ Agent failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
