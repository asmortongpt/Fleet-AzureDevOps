/**
 * Fleet API - Main Entry Point
 *
 * This file serves as the minimal entry point for the Fleet API.
 * The actual server implementation is in server.ts
 *
 * Use this for:
 * - Type checking: npx tsc --noEmit src/main.ts
 * - Simple server startup: tsx src/main.ts
 *
 * For production use: tsx src/server.ts
 */

// Re-export server for type checking
export { };

// Minimal type declarations for TypeScript compliance
declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: string;
    }
  }
}

console.log('[MAIN] Fleet API entry point loaded');
console.log('[MAIN] For full server, run: npm run dev or npm start');