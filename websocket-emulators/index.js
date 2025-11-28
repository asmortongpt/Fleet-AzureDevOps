/**
 * Fleet WebSocket Emulators - Master Controller
 *
 * Starts all three WebSocket emulators:
 * - OBD2 Telemetry (port 8081)
 * - Radio Communications (port 8082)
 * - Dispatch Events (port 8083)
 *
 * Usage: node index.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const emulators = [
  { name: 'OBD2', file: 'obd2-emulator.js', port: 8081 },
  { name: 'Radio', file: 'radio-emulator.js', port: 8082 },
  { name: 'Dispatch', file: 'dispatch-emulator.js', port: 8083 },
];

const processes = [];

console.log('🚀 Starting Fleet WebSocket Emulators...\n');

emulators.forEach(({ name, file, port }) => {
  const child = spawn('node', [join(__dirname, file)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      [`${name.toUpperCase()}_PORT`]: port,
    },
  });

  child.on('error', (error) => {
    console.error(`❌ ${name} Emulator failed to start:`, error.message);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`❌ ${name} Emulator exited with code ${code}, signal ${signal}`);
    } else {
      console.log(`✅ ${name} Emulator stopped gracefully`);
    }
  });

  processes.push({ name, child });
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down all emulators...`);

  processes.forEach(({ name, child }) => {
    console.log(`Stopping ${name} Emulator...`);
    child.kill('SIGTERM');
  });

  setTimeout(() => {
    processes.forEach(({ name, child }) => {
      if (!child.killed) {
        console.log(`Force killing ${name} Emulator...`);
        child.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log(`
╔═══════════════════════════════════════════════════════╗
║     Fleet WebSocket Emulators Running                 ║
╠═══════════════════════════════════════════════════════╣
║  🚗 OBD2 Telemetry:      ws://localhost:8081         ║
║  📻 Radio Comms:         ws://localhost:8082         ║
║  📋 Dispatch Events:     ws://localhost:8083         ║
╠═══════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop all emulators                   ║
╚═══════════════════════════════════════════════════════╝
`);
