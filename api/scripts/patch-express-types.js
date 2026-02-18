#!/usr/bin/env node
/**
 * Patch @types/express-serve-static-core for Express 5 compatibility.
 *
 * Express 5 types `ParamsDictionary` values as `string | string[]` because
 * wildcard params (`{*name}`) can return arrays. However, the vast majority
 * of this codebase uses standard `:param` routes that always resolve to
 * `string`. This patch restores the Express 4 behavior (`string` only) so
 * existing code doesn't need 400+ type casts.
 *
 * The few wildcard routes (e.g. storage-admin.ts) handle the array case
 * explicitly with `Array.isArray()` checks.
 *
 * Run automatically via the `postinstall` npm script.
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@types',
  'express-serve-static-core',
  'index.d.ts'
);

if (!fs.existsSync(targetFile)) {
  console.log('[patch-express-types] @types/express-serve-static-core not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');

const original = `export interface ParamsDictionary {
    [key: string]: string | string[];
    [key: number]: string;
}`;

const patched = `export interface ParamsDictionary {
    [key: string]: string;
    [key: number]: string;
}`;

if (content.includes(patched)) {
  console.log('[patch-express-types] Already patched.');
  process.exit(0);
}

if (!content.includes(original)) {
  console.warn('[patch-express-types] WARNING: Could not find expected ParamsDictionary definition to patch.');
  console.warn('[patch-express-types] @types/express-serve-static-core may have been updated. Review manually.');
  process.exit(0);
}

content = content.replace(original, patched);
fs.writeFileSync(targetFile, content, 'utf8');
console.log('[patch-express-types] Patched ParamsDictionary: string | string[] -> string');
