/**
 * Generate Bcrypt Password Hashes for Test Users
 *
 * Usage:
 *   npx ts-node api/src/scripts/generate-password-hash.ts
 */

import * as bcrypt from 'bcryptjs';

async function generateHash(password: string, rounds: number = 12): Promise<string> {
  return bcrypt.hash(password, rounds);
}

async function main() {
  const password = 'Test123!';
  const rounds = 12;

  console.log('🔐 Generating bcrypt password hash...\n');
  console.log(`Password: ${password}`);
  console.log(`Cost factor: ${rounds}\n`);

  const hash = await generateHash(password, rounds);

  console.log('Generated hash:');
  console.log(hash);
  console.log('\n✅ Hash generated successfully!\n');

  console.log('Verification test:');
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Password "${password}" matches hash: ${isValid ? '✅ YES' : '❌ NO'}\n');

  if (isValid) {
    console.log('📋 Use this hash in your SQL INSERT statements:');
    console.log(`'${hash}'`);
  }
}

main().catch(console.error);
