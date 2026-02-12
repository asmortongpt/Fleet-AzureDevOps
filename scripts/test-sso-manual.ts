#!/usr/bin/env tsx
/**
 * Manual SSO Testing Script
 *
 * Interactive script for testing SSO authentication flow step-by-step.
 * Provides detailed diagnostics and verification at each stage.
 *
 * Usage:
 *   npm run test:sso-manual
 *   or
 *   tsx scripts/test-sso-manual.ts
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const rl = readline.createInterface({ input, output });

interface TestResult {
  step: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: number, title: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}STEP ${step}: ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

function logResult(passed: boolean, message: string) {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(`${icon} ${message}`, color);
}

function addResult(step: string, passed: boolean, message: string, details?: any) {
  results.push({ step, passed, message, details });
  logResult(passed, message);
}

async function question(prompt: string): Promise<string> {
  return await rl.question(`${colors.cyan}${prompt}${colors.reset}`);
}

async function testEnvironmentConfig() {
  logStep(1, 'Environment Configuration Check');

  // Check for required environment variables
  const requiredEnvVars = [
    'VITE_AZURE_AD_CLIENT_ID',
    'VITE_AZURE_AD_TENANT_ID',
    'VITE_AZURE_AD_REDIRECT_URI'
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const isSet = !!value;

    addResult(
      'Environment Config',
      isSet,
      `${envVar}: ${isSet ? 'SET' : 'MISSING'}`,
      { value: isSet ? value : 'undefined' }
    );
  }

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testAzureADConfig() {
  logStep(2, 'Azure AD Configuration Validation');

  const clientId = process.env.VITE_AZURE_AD_CLIENT_ID;
  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID;
  const redirectUri = process.env.VITE_AZURE_AD_REDIRECT_URI;

  // Validate Client ID format (GUID)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (clientId) {
    const isValidGuid = guidRegex.test(clientId);
    addResult(
      'Azure AD Config',
      isValidGuid,
      `Client ID format: ${isValidGuid ? 'VALID GUID' : 'INVALID'}`,
      { clientId }
    );
  }

  if (tenantId) {
    const isValidGuid = guidRegex.test(tenantId);
    addResult(
      'Azure AD Config',
      isValidGuid,
      `Tenant ID format: ${isValidGuid ? 'VALID GUID' : 'INVALID'}`,
      { tenantId }
    );
  }

  if (redirectUri) {
    const isHttps = redirectUri.startsWith('https://') || redirectUri.startsWith('http://localhost');
    addResult(
      'Azure AD Config',
      isHttps,
      `Redirect URI protocol: ${isHttps ? 'VALID (HTTPS or localhost)' : 'INVALID (must use HTTPS)'}`,
      { redirectUri }
    );

    const hasCallback = redirectUri.includes('/auth/callback');
    addResult(
      'Azure AD Config',
      hasCallback,
      `Redirect URI path: ${hasCallback ? 'CONTAINS /auth/callback' : 'MISSING /auth/callback'}`,
      { redirectUri }
    );
  }

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testLoginPage() {
  logStep(3, 'Login Page Manual Verification');

  log('\nPlease open your browser and navigate to the login page:');
  log(`URL: ${process.env.VITE_AZURE_AD_REDIRECT_URI?.replace('/auth/callback', '/login')}`, colors.yellow);

  console.log('\nVerify the following on the login page:');
  console.log('  1. ArchonY logo is displayed');
  console.log('  2. "Capital Tech Alliance" text is visible');
  console.log('  3. "Sign in with Microsoft" button is present');
  console.log('  4. No JavaScript errors in browser console');

  const logoVisible = await question('\nIs the ArchonY logo visible? (y/n): ');
  addResult('Login Page', logoVisible.toLowerCase() === 'y', 'ArchonY logo visibility');

  const ctaVisible = await question('Is "Capital Tech Alliance" text visible? (y/n): ');
  addResult('Login Page', ctaVisible.toLowerCase() === 'y', 'CTA branding visibility');

  const buttonVisible = await question('Is "Sign in with Microsoft" button visible? (y/n): ');
  addResult('Login Page', buttonVisible.toLowerCase() === 'y', 'Microsoft sign-in button');

  const noErrors = await question('Are there no JavaScript errors in console? (y/n): ');
  addResult('Login Page', noErrors.toLowerCase() === 'y', 'No JavaScript errors');

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testSSORedirect() {
  logStep(4, 'SSO Redirect Flow');

  log('\nClick the "Sign in with Microsoft" button in your browser.');
  log('You should be redirected to Microsoft\'s login page.', colors.yellow);

  console.log('\nVerify the following:');
  console.log('  1. Redirected to login.microsoftonline.com');
  console.log('  2. URL contains your client_id');
  console.log('  3. URL contains redirect_uri parameter');
  console.log('  4. No error messages displayed');

  const redirected = await question('\nWere you redirected to login.microsoftonline.com? (y/n): ');
  addResult('SSO Redirect', redirected.toLowerCase() === 'y', 'Redirect to Microsoft login');

  if (redirected.toLowerCase() === 'y') {
    const urlContents = await question('Does the URL contain your client_id? (y/n): ');
    addResult('SSO Redirect', urlContents.toLowerCase() === 'y', 'Client ID in redirect URL');

    const hasRedirectUri = await question('Does the URL contain redirect_uri parameter? (y/n): ');
    addResult('SSO Redirect', hasRedirectUri.toLowerCase() === 'y', 'Redirect URI in URL params');
  }

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testMicrosoftLogin() {
  logStep(5, 'Microsoft Authentication');

  log('\nEnter your Microsoft credentials in the login form.');
  log('Use a valid test account for your tenant.', colors.yellow);

  console.log('\nVerify the following:');
  console.log('  1. Email input accepts your email');
  console.log('  2. Password input accepts your password');
  console.log('  3. "Sign in" button is clickable');
  console.log('  4. No authentication errors');

  const canLogin = await question('\nWere you able to complete Microsoft login? (y/n): ');
  addResult('Microsoft Login', canLogin.toLowerCase() === 'y', 'Microsoft authentication completed');

  if (canLogin.toLowerCase() === 'y') {
    const staySignedIn = await question('Did you see "Stay signed in?" prompt? (y/n): ');
    addResult('Microsoft Login', true, `"Stay signed in" prompt: ${staySignedIn.toLowerCase() === 'y' ? 'YES' : 'NO'}`);
  }

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testCallback() {
  logStep(6, 'Callback Handling');

  log('\nAfter Microsoft login, you should be redirected back to the app.');
  log('Watch the /auth/callback route in your browser.', colors.yellow);

  console.log('\nVerify the following:');
  console.log('  1. Redirected to /auth/callback');
  console.log('  2. Cinematic loading screen appears');
  console.log('  3. No errors in browser console');
  console.log('  4. Redirected to dashboard after processing');

  const reachedCallback = await question('\nDid you reach /auth/callback? (y/n): ');
  addResult('Callback', reachedCallback.toLowerCase() === 'y', 'Redirected to callback endpoint');

  if (reachedCallback.toLowerCase() === 'y') {
    const sawLoading = await question('Did you see the loading screen? (y/n): ');
    addResult('Callback', sawLoading.toLowerCase() === 'y', 'Callback loading screen displayed');

    const noErrors = await question('Were there no console errors? (y/n): ');
    addResult('Callback', noErrors.toLowerCase() === 'y', 'No callback processing errors');

    const reachedDashboard = await question('Were you redirected to the dashboard? (y/n): ');
    addResult('Callback', reachedDashboard.toLowerCase() === 'y', 'Successful redirect to dashboard');
  }

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testAuthenticatedState() {
  logStep(7, 'Authenticated State Verification');

  log('\nVerify that you are now authenticated:');

  console.log('\nCheck the following:');
  console.log('  1. User menu or avatar is displayed');
  console.log('  2. No redirect to login page');
  console.log('  3. Can access protected routes (e.g., /fleet, /drivers)');
  console.log('  4. Session persists on page refresh');

  const userMenuVisible = await question('\nIs the user menu/avatar visible? (y/n): ');
  addResult('Authenticated State', userMenuVisible.toLowerCase() === 'y', 'User menu displayed');

  const noLoginRedirect = await question('Can you access the dashboard without login redirect? (y/n): ');
  addResult('Authenticated State', noLoginRedirect.toLowerCase() === 'y', 'No login redirect');

  const canAccessRoutes = await question('Can you access protected routes (e.g., /fleet)? (y/n): ');
  addResult('Authenticated State', canAccessRoutes.toLowerCase() === 'y', 'Protected routes accessible');

  log('\nRefresh the page (F5 or Cmd+R)...', colors.yellow);
  const persistsRefresh = await question('Does the session persist after refresh? (y/n): ');
  addResult('Authenticated State', persistsRefresh.toLowerCase() === 'y', 'Session persists on refresh');

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testTokenInspection() {
  logStep(8, 'Token Inspection (Browser DevTools)');

  log('\nOpen browser DevTools and inspect the session:');

  console.log('\nApplication Tab > Cookies:');
  console.log('  1. Check for auth_token or session cookie');
  console.log('  2. Verify HttpOnly flag is set');
  console.log('  3. Verify Secure flag is set (if HTTPS)');
  console.log('  4. Verify SameSite=Strict');

  console.log('\nApplication Tab > Session Storage:');
  console.log('  5. Check for MSAL account data');
  console.log('  6. Verify no access tokens in plain text');

  const hasCookie = await question('\nDoes auth_token or session cookie exist? (y/n): ');
  addResult('Token Inspection', hasCookie.toLowerCase() === 'y', 'Auth cookie present');

  if (hasCookie.toLowerCase() === 'y') {
    const isHttpOnly = await question('Is HttpOnly flag set? (y/n): ');
    addResult('Token Inspection', isHttpOnly.toLowerCase() === 'y', 'HttpOnly flag set');

    const isSecure = await question('Is Secure flag set (if using HTTPS)? (y/n): ');
    addResult('Token Inspection', isSecure.toLowerCase() === 'y', 'Secure flag set');

    const isSameSite = await question('Is SameSite=Strict? (y/n): ');
    addResult('Token Inspection', isSameSite.toLowerCase() === 'y', 'SameSite=Strict set');
  }

  const hasMsalData = await question('Does Session Storage contain MSAL data? (y/n): ');
  addResult('Token Inspection', hasMsalData.toLowerCase() === 'y', 'MSAL session data present');

  const noPlainTokens = await question('Are there no plain text access tokens visible? (y/n): ');
  addResult('Token Inspection', noPlainTokens.toLowerCase() === 'y', 'No exposed access tokens');

  console.log('\n');
  const continueTest = await question('Continue to next step? (y/n): ');
  return continueTest.toLowerCase() === 'y';
}

async function testLogout() {
  logStep(9, 'Logout Flow');

  log('\nTest the logout functionality:');

  console.log('\n  1. Click user menu');
  console.log('  2. Click "Logout" or "Sign Out"');
  console.log('  3. Verify redirect to login page');
  console.log('  4. Verify session is cleared');

  const canLogout = await question('\nWere you able to find and click logout? (y/n): ');
  addResult('Logout', canLogout.toLowerCase() === 'y', 'Logout button accessible');

  if (canLogout.toLowerCase() === 'y') {
    const redirectedToLogin = await question('Were you redirected to login page? (y/n): ');
    addResult('Logout', redirectedToLogin.toLowerCase() === 'y', 'Redirect to login after logout');

    const cannotAccessProtected = await question('Are protected routes now blocked? (y/n): ');
    addResult('Logout', cannotAccessProtected.toLowerCase() === 'y', 'Protected routes blocked after logout');

    log('\nCheck DevTools > Application > Cookies', colors.yellow);
    const cookieCleared = await question('Is the auth cookie cleared/expired? (y/n): ');
    addResult('Logout', cookieCleared.toLowerCase() === 'y', 'Auth cookie cleared');

    log('Check DevTools > Application > Session Storage', colors.yellow);
    const sessionCleared = await question('Is session storage cleared? (y/n): ');
    addResult('Logout', sessionCleared.toLowerCase() === 'y', 'Session storage cleared');
  }

  console.log('\n');
}

async function displaySummary() {
  logStep(10, 'Test Summary');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  // Group results by step
  const steps = [...new Set(results.map(r => r.step))];

  for (const step of steps) {
    const stepResults = results.filter(r => r.step === step);
    const stepPassed = stepResults.every(r => r.passed);

    console.log(`\n${colors.bright}${step}:${colors.reset}`);
    for (const result of stepResults) {
      logResult(result.passed, `  ${result.message}`);
      if (result.details) {
        log(`    Details: ${JSON.stringify(result.details, null, 2)}`, colors.cyan);
      }
    }
  }

  // Save results to file
  const fs = await import('fs/promises');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `sso-test-results-${timestamp}.json`;

  await fs.writeFile(filename, JSON.stringify(results, null, 2));
  log(`\nTest results saved to: ${filename}`, colors.yellow);
}

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════════════════════╗', colors.bright);
  log('║                    SSO MANUAL TESTING SCRIPT                              ║', colors.bright);
  log('║                    ArchonY Fleet Management                               ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════════════════════╝', colors.bright);

  log('\nThis script will guide you through manual SSO testing.', colors.cyan);
  log('Follow the prompts and verify each step in your browser.\n', colors.cyan);

  const startTest = await question('Ready to begin? (y/n): ');

  if (startTest.toLowerCase() !== 'y') {
    log('\nTest cancelled.', colors.yellow);
    rl.close();
    return;
  }

  try {
    let shouldContinue = await testEnvironmentConfig();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testAzureADConfig();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testLoginPage();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testSSORedirect();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testMicrosoftLogin();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testCallback();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testAuthenticatedState();
    if (!shouldContinue) throw new Error('Test aborted by user');

    shouldContinue = await testTokenInspection();
    if (!shouldContinue) throw new Error('Test aborted by user');

    await testLogout();

    await displaySummary();

    log('\n✓ Manual SSO testing completed!', colors.green);
  } catch (error) {
    if (error instanceof Error && error.message === 'Test aborted by user') {
      log('\nTest aborted by user.', colors.yellow);
    } else {
      log(`\nError during testing: ${error}`, colors.red);
    }
  } finally {
    rl.close();
  }
}

main();
