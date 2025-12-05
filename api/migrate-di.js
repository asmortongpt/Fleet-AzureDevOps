#!/usr/bin/env node
/**
 * Script to migrate Tier 3 Document Management services to DI pattern
 */

const fs = require('fs');
const path = require('path');

const services = [
  'document-folder.service.ts',
  'document-permission.service.ts',
  'document-version.service.ts',
  'DocumentIndexer.ts',
  'DocumentSearchService.ts',
  'DocumentAiService.ts',
  'document-rag.service.ts',
  'document-geo.service.ts',
  'document-management.service.ts',
  'document-search.service.ts',
  'document-storage.service.ts'
];

const serviceDir = path.join(__dirname, 'src', 'services');

services.forEach(serviceName => {
  const filePath = path.join(serviceDir, serviceName);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${serviceName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Step 1: Change import pool to import { Pool }
  content = content.replace(
    /import pool from ['"]\.\.\/config\/database['"]/g,
    "import { Pool } from 'pg'"
  );

  // Step 2: Add logger import if console is used
  if (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn')) {
    const importMatch = content.match(/^(import.*?\n)+/m);
    if (importMatch) {
      const lastImport = importMatch[0];
      if (!lastImport.includes("import logger from")) {
        content = content.replace(
          lastImport,
          lastImport + "import logger from '../utils/logger'\n"
        );
      }
    }
  }

  // Step 3: Add constructor to class
  // Find the class declaration
  const classMatch = content.match(/export class (\w+Service|\w+Indexer|\w+) \{/);
  if (classMatch) {
    const className = classMatch[1];
    const classStartIndex = classMatch.index + classMatch[0].length;

    // Check if constructor already exists
    if (!content.includes('constructor(')) {
      // Add constructor after class declaration
      const indent = '  ';
      const constructor = `\n${indent}constructor(private db: Pool, private logger: typeof logger) {}\n`;
      content = content.slice(0, classStartIndex) + constructor + content.slice(classStartIndex);
    }
  }

  // Step 4: Replace all pool.query with this.db.query
  content = content.replace(/pool\.query\(/g, 'this.db.query(');
  content = content.replace(/pool\.connect\(/g, 'this.db.connect(');

  // Step 5: Replace console.log, console.error, console.warn
  content = content.replace(/console\.log\(/g, 'this.logger.info(');
  content = content.replace(/console\.error\(/g, 'this.logger.error(');
  content = content.replace(/console\.warn\(/g, 'this.logger.warn(');

  // Step 6: Change export to export class instead of singleton
  content = content.replace(
    /export default new (\w+Service|\w+Indexer|\w+)\(\)/g,
    'export default $1'
  );

  // Write the file back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Migrated: ${serviceName}`);
});

console.log('\n✅ Migration complete!');
