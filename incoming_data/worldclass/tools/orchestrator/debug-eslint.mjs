import { execa } from 'execa';

const args = [
  '.',
  '--format=json',
  '--ext',
  '.ts,.tsx',
  '--config',
  '../../.eslintrc.json',
  '--no-error-on-unmatched-pattern',
];

console.log('Running ESLint with args:', args);

try {
  const { stdout, stderr, exitCode } = await execa('npx', ['eslint', ...args], {
    cwd: '/Users/andrewmorton/Documents/GitHub/Fleet',
    timeout: 60000,
    reject: false,
  });

  console.log('\nExit code:', exitCode);
  console.log('\nStdout length:', stdout.length);
  console.log('Stderr length:', stderr.length);
  
  if (stderr) {
    console.log('\nStderr:', stderr.substring(0, 500));
  }
  
  if (stdout) {
    console.log('\nStdout preview:', stdout.substring(0, 300));
    try {
      const parsed = JSON.parse(stdout);
      console.log('\nParsed successfully!');
      console.log('Type:', Array.isArray(parsed) ? 'array' : typeof parsed);
      console.log('Length/keys:', Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length);
    } catch (e) {
      console.log('\nFailed to parse JSON:', e.message);
    }
  }
} catch (error) {
  console.error('Execution error:', error.message);
}
