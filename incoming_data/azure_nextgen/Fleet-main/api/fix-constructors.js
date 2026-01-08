#!/usr/bin/env node
/**
 * Fix constructors in migrated services to add DI parameters
 */

const fs = require('fs');
const path = require('path');

const services = [
  { file: 'document-rag.service.ts', class: 'DocumentRAGService' },
  { file: 'document-geo.service.ts', class: 'DocumentGeoService' },
  { file: 'document-storage.service.ts', class: 'DocumentStorageService' },
  { file: 'DocumentIndexer.ts', class: 'DocumentIndexer' },
  { file: 'document-version.service.ts', class: 'DocumentVersionService' },
  { file: 'DocumentAiService.ts', class: 'DocumentAiService' },
  { file: 'DocumentSearchService.ts', class: 'DocumentSearchService' },
  { file: 'document-search.service.ts', class: 'DocumentSearchService' }
];

const serviceDir = path.join(__dirname, 'src', 'services');

services.forEach(({ file, class: className }) => {
  const filePath = path.join(serviceDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace constructor() { with constructor(private db: Pool, private logger: typeof logger) {
  const oldConstructor = /constructor\(\)\s*\{/g;
  const newConstructor = 'constructor(private db: Pool, private logger: typeof logger) {';

  if (oldConstructor.test(content)) {
    content = content.replace(oldConstructor, newConstructor);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed constructor in: ${file}`);
  } else {
    console.log(`ℹ️  No constructor() found in: ${file}`);
  }
});

console.log('\n✅ Constructor fixes complete!');
