#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Removes markdown code fences and explanatory text from TypeScript files
 */

const files = [
  'src/server-websocket.ts',
  'src/routes/auth/azure-ad.ts',
  'src/routes/weather.ts',
  'src/routes/traffic-cameras.ts',
  'src/services/traffic/fl511-cameras.service.ts',
  'src/services/traffic/camera-map-layers.service.ts',
  'src/services/websocket/handlers.ts',
  'src/services/websocket/server.ts',
  'src/services/auth/azure-ad.service.ts',
  'src/services/tracking/location-broadcaster.ts',
  'src/services/weather/map-layers.service.ts',
  'src/services/weather/nws.service.ts'
];

function cleanMarkdownFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove markdown code fences
  content = content.replace(/^```typescript\s*\n/gm, '');
  content = content.replace(/^```\s*\n/gm, '');
  content = content.replace(/\n```\s*$/gm, '');

  // Remove AI-generated preamble
  if (content.startsWith("Here's a TypeScript")) {
    const lines = content.split('\n');
    let startIndex = 0;

    // Find first import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') ||
          lines[i].trim().startsWith('export ') ||
          lines[i].trim().startsWith('interface ') ||
          lines[i].trim().startsWith('type ') ||
          lines[i].trim().startsWith('const ') ||
          lines[i].trim().startsWith('class ')) {
        startIndex = i;
        break;
      }
    }

    content = lines.slice(startIndex).join('\n');
  }

  // Remove trailing explanatory text after the last closing brace/semicolon
  const lines = content.split('\n');
  let lastCodeLine = lines.length - 1;

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 0 &&
        (trimmed.endsWith('}') || trimmed.endsWith(';') ||
         trimmed === 'export default jwtMiddleware;' ||
         trimmed.startsWith('export '))) {
      lastCodeLine = i;
      break;
    }
  }

  content = lines.slice(0, lastCodeLine + 1).join('\n') + '\n';

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Cleaned: ${filePath}`);
    return true;
  }

  return false;
}

console.log('Cleaning markdown from TypeScript files...\n');

let cleanedCount = 0;
for (const file of files) {
  if (cleanMarkdownFile(file)) {
    cleanedCount++;
  }
}

console.log(`\n✓ Cleaned ${cleanedCount} files`);
