const bcrypt = require('bcrypt');

async function main() {
  const password = 'Test123!';
  const rounds = 12;

  console.log('Generating bcrypt password hash...\n');
  console.log('Password:', password);
  console.log('Cost factor:', rounds, '\n');

  const hash = await bcrypt.hash(password, rounds);

  console.log('Generated hash:');
  console.log(hash);
  console.log('\nHash generated successfully!\n');

  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid ? 'PASS' : 'FAIL', '\n');

  if (isValid) {
    console.log('Use this in SQL:');
    console.log("'" + hash + "'");
  }
}

main().catch(console.error);
