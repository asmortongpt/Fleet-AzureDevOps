#!/usr/bin/env node

/**
 * Quick verification script to check React version and basic compatibility
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== React Downgrade Verification ===\n');

// Check package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('✓ React version in package.json:', packageJson.dependencies.react);
console.log('✓ React DOM version in package.json:', packageJson.dependencies['react-dom']);
console.log('✓ React Router DOM version in package.json:', packageJson.dependencies['react-router-dom']);

// Check installed node_modules
try {
  const reactPkg = JSON.parse(fs.readFileSync('node_modules/react/package.json', 'utf8'));
  const reactDomPkg = JSON.parse(fs.readFileSync('node_modules/react-dom/package.json', 'utf8'));
  const routerPkg = JSON.parse(fs.readFileSync('node_modules/react-router-dom/package.json', 'utf8'));

  console.log('\n✓ Installed React version:', reactPkg.version);
  console.log('✓ Installed React DOM version:', reactDomPkg.version);
  console.log('✓ Installed React Router DOM version:', routerPkg.version);

  // Verify versions are React 18
  const isReact18 = reactPkg.version.startsWith('18.');
  const isReactDom18 = reactDomPkg.version.startsWith('18.');
  const isRouter6 = routerPkg.version.startsWith('6.');

  console.log('\n=== Compatibility Check ===\n');
  console.log(isReact18 ? '✓ React 18.x installed' : '✗ ERROR: Not React 18');
  console.log(isReactDom18 ? '✓ React DOM 18.x installed' : '✗ ERROR: Not React DOM 18');
  console.log(isRouter6 ? '✓ React Router 6.x installed (compatible with React 18)' : '✗ ERROR: Not React Router 6');

  // Check for React 19 specific packages
  const checkPackage = (name) => {
    const pkgPath = `node_modules/${name}/package.json`;
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version;
    }
    return null;
  };

  console.log('\n=== Critical Dependencies ===\n');
  console.log('✓ @react-three/fiber:', checkPackage('@react-three/fiber'));
  console.log('✓ @react-three/drei:', checkPackage('@react-three/drei'));
  console.log('✓ react-leaflet:', checkPackage('react-leaflet'));

  // Check dist build
  const distExists = fs.existsSync('dist');
  const indexHtmlExists = fs.existsSync('dist/index.html');

  console.log('\n=== Build Artifacts ===\n');
  console.log(distExists ? '✓ dist directory exists' : '✗ dist directory missing');
  console.log(indexHtmlExists ? '✓ dist/index.html exists' : '✗ dist/index.html missing');

  console.log('\n=== SUMMARY ===\n');
  if (isReact18 && isReactDom18 && isRouter6 && distExists && indexHtmlExists) {
    console.log('✓✓✓ All checks PASSED - React 18 downgrade successful! ✓✓✓');
    console.log('\nNext step: Deploy to production');
    process.exit(0);
  } else {
    console.log('✗✗✗ Some checks FAILED - Review errors above ✗✗✗');
    process.exit(1);
  }

} catch (error) {
  console.error('\n✗ ERROR:', error.message);
  process.exit(1);
}
