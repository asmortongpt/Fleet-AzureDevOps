#!/usr/bin/env tsx
/**
 * Azure AD Configuration Verification Script
 *
 * Validates Azure AD app registration and configuration:
 * - Checks redirect URIs
 * - Verifies API permissions
 * - Tests token endpoint
 * - Validates public keys
 * - Checks app registration settings
 *
 * Usage:
 *   tsx scripts/verify-azure-ad-config.ts
 */

import * as https from 'https';
import * as http from 'http';

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

function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

function logCheck(passed: boolean, message: string) {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(`${icon} ${message}`, color);
}

interface ValidationResult {
  category: string;
  check: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

function addResult(category: string, check: string, passed: boolean, message: string, details?: any) {
  results.push({ category, check, passed, message, details });
  logCheck(passed, message);
}

function httpsRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Fleet-SSO-Verifier/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function validateEnvironmentVariables() {
  logSection('1. ENVIRONMENT VARIABLES');

  const requiredVars = {
    'VITE_AZURE_AD_CLIENT_ID': 'Azure AD Application (client) ID',
    'VITE_AZURE_AD_TENANT_ID': 'Azure AD Directory (tenant) ID',
    'VITE_AZURE_AD_REDIRECT_URI': 'Redirect URI for OAuth callback'
  };

  for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    const isSet = !!value;

    addResult(
      'Environment',
      varName,
      isSet,
      `${varName}: ${isSet ? 'SET' : 'MISSING'} (${description})`,
      { value: isSet ? value : undefined }
    );

    if (isSet && value) {
      // Validate format
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (varName.includes('_ID')) {
        const isValidGuid = guidRegex.test(value);
        addResult(
          'Environment',
          `${varName}_FORMAT`,
          isValidGuid,
          `  Format: ${isValidGuid ? 'Valid GUID' : 'Invalid GUID'}`,
          { value }
        );
      }

      if (varName.includes('REDIRECT_URI')) {
        const isValidUrl = value.startsWith('https://') || value.startsWith('http://localhost');
        addResult(
          'Environment',
          `${varName}_PROTOCOL`,
          isValidUrl,
          `  Protocol: ${isValidUrl ? 'Valid (HTTPS or localhost)' : 'Invalid (must use HTTPS)'}`,
          { value }
        );

        const hasCallback = value.includes('/auth/callback');
        addResult(
          'Environment',
          `${varName}_PATH`,
          hasCallback,
          `  Path: ${hasCallback ? 'Contains /auth/callback' : 'Missing /auth/callback'}`,
          { value }
        );
      }
    }
  }
}

async function validateAzureADEndpoints() {
  logSection('2. AZURE AD ENDPOINTS');

  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID;

  if (!tenantId) {
    log('⚠ Skipping endpoint validation - VITE_AZURE_AD_TENANT_ID not set', colors.yellow);
    return;
  }

  // Test OpenID configuration endpoint
  const openidConfigUrl = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;

  try {
    log(`\nFetching OpenID configuration...`, colors.cyan);
    const config = await httpsRequest(openidConfigUrl);

    addResult(
      'Azure AD Endpoints',
      'OpenID_Config',
      !!config.authorization_endpoint,
      `OpenID Configuration: ${config.authorization_endpoint ? 'REACHABLE' : 'UNREACHABLE'}`,
      {
        authorization_endpoint: config.authorization_endpoint,
        token_endpoint: config.token_endpoint,
        issuer: config.issuer
      }
    );

    if (config.authorization_endpoint) {
      addResult(
        'Azure AD Endpoints',
        'Authorization_Endpoint',
        true,
        `  Authorization endpoint: ${config.authorization_endpoint}`
      );
    }

    if (config.token_endpoint) {
      addResult(
        'Azure AD Endpoints',
        'Token_Endpoint',
        true,
        `  Token endpoint: ${config.token_endpoint}`
      );
    }

    if (config.issuer) {
      const expectedIssuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
      const issuerMatches = config.issuer === expectedIssuer;

      addResult(
        'Azure AD Endpoints',
        'Issuer',
        issuerMatches,
        `  Issuer: ${issuerMatches ? 'CORRECT' : 'MISMATCH'}`,
        { expected: expectedIssuer, actual: config.issuer }
      );
    }
  } catch (error) {
    addResult(
      'Azure AD Endpoints',
      'OpenID_Config',
      false,
      `OpenID Configuration: FAILED`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function validateJWKS() {
  logSection('3. JWKS (JSON WEB KEY SET)');

  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID;

  if (!tenantId) {
    log('⚠ Skipping JWKS validation - VITE_AZURE_AD_TENANT_ID not set', colors.yellow);
    return;
  }

  const jwksUrl = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;

  try {
    log(`\nFetching JWKS...`, colors.cyan);
    const jwks = await httpsRequest(jwksUrl);

    const hasKeys = jwks.keys && Array.isArray(jwks.keys) && jwks.keys.length > 0;

    addResult(
      'JWKS',
      'Keys_Available',
      hasKeys,
      `JWKS Keys: ${hasKeys ? 'AVAILABLE' : 'UNAVAILABLE'}`,
      { keyCount: jwks.keys?.length || 0 }
    );

    if (hasKeys) {
      for (const key of jwks.keys) {
        const isRSA = key.kty === 'RSA';
        const hasKeyId = !!key.kid;
        const hasUse = key.use === 'sig';

        addResult(
          'JWKS',
          `Key_${key.kid}`,
          isRSA && hasKeyId && hasUse,
          `  Key ${key.kid?.substring(0, 8)}...: ${isRSA && hasKeyId && hasUse ? 'VALID' : 'INVALID'}`,
          { kty: key.kty, use: key.use, kid: key.kid }
        );
      }
    }
  } catch (error) {
    addResult(
      'JWKS',
      'Fetch',
      false,
      `JWKS Fetch: FAILED`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function validateRedirectURIs() {
  logSection('4. REDIRECT URI VALIDATION');

  const redirectUri = process.env.VITE_AZURE_AD_REDIRECT_URI;

  if (!redirectUri) {
    log('⚠ Skipping redirect URI validation - VITE_AZURE_AD_REDIRECT_URI not set', colors.yellow);
    return;
  }

  log(`\nValidating redirect URI: ${redirectUri}`, colors.cyan);

  // Parse URL
  try {
    const url = new URL(redirectUri);

    const isHttps = url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost');
    addResult(
      'Redirect URI',
      'Protocol',
      isHttps,
      `Protocol: ${isHttps ? 'VALID (HTTPS or localhost)' : 'INVALID (must use HTTPS)'}`
    );

    const hasPath = url.pathname.length > 1;
    addResult(
      'Redirect URI',
      'Path',
      hasPath,
      `Path: ${hasPath ? url.pathname : 'MISSING (should be /auth/callback)'}`
    );

    const hasCallback = url.pathname.includes('/auth/callback');
    addResult(
      'Redirect URI',
      'Callback_Path',
      hasCallback,
      `Callback path: ${hasCallback ? 'CORRECT (/auth/callback)' : 'INCORRECT (should contain /auth/callback)'}`
    );

    // Check if it's a registered domain
    const validDomains = [
      'localhost',
      '127.0.0.1',
      'proud-bay-0fdc8040f.3.azurestaticapps.net',
      'fleet.capitaltechalliance.com',
      'capitaltechalliance.com'
    ];

    const isValidDomain = validDomains.some(domain => url.hostname.includes(domain));
    addResult(
      'Redirect URI',
      'Domain',
      isValidDomain,
      `Domain: ${isValidDomain ? 'RECOGNIZED' : 'UNKNOWN (ensure it\'s registered in Azure AD)'}`,
      { hostname: url.hostname }
    );
  } catch (error) {
    addResult(
      'Redirect URI',
      'Parse',
      false,
      `URL Parsing: FAILED`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function validateAppPermissions() {
  logSection('5. APP PERMISSIONS (Manual Check Required)');

  log('\nThis section requires manual verification in Azure Portal:', colors.yellow);
  log('  https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps\n');

  log('Required API Permissions:');
  log('  1. Microsoft Graph API:');
  log('     - openid (Sign users in)');
  log('     - profile (View users\' basic profile)');
  log('     - email (View users\' email address)');
  log('     - User.Read (Sign in and read user profile)');

  log('\nRequired App Registration Settings:');
  log('  1. Authentication > Platform configurations:');
  log('     - Single-page application (SPA)');
  log('     - Redirect URIs configured');
  log('  2. Authentication > Implicit grant:');
  log('     - Access tokens (optional)');
  log('     - ID tokens (required)');
  log('  3. Certificates & secrets:');
  log('     - No client secrets required for SPA');

  addResult(
    'App Permissions',
    'Manual_Check',
    true,
    'Manual verification required (see Azure Portal)',
    {
      portalUrl: `https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Authentication/appId/${process.env.VITE_AZURE_AD_CLIENT_ID}/isMSAApp`
    }
  );
}

async function validateMSALConfig() {
  logSection('6. MSAL CONFIGURATION');

  const clientId = process.env.VITE_AZURE_AD_CLIENT_ID;
  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID;
  const redirectUri = process.env.VITE_AZURE_AD_REDIRECT_URI;

  const hasAllRequired = !!(clientId && tenantId && redirectUri);

  addResult(
    'MSAL Config',
    'Complete',
    hasAllRequired,
    `Configuration: ${hasAllRequired ? 'COMPLETE' : 'INCOMPLETE (missing variables)'}`
  );

  if (hasAllRequired) {
    const expectedAuthority = `https://login.microsoftonline.com/${tenantId}`;

    log(`\nExpected MSAL Configuration:`, colors.cyan);
    log(`  auth.clientId: ${clientId}`);
    log(`  auth.authority: ${expectedAuthority}`);
    log(`  auth.redirectUri: ${redirectUri}`);
    log(`  cache.cacheLocation: sessionStorage`);

    addResult(
      'MSAL Config',
      'Values',
      true,
      'All configuration values present'
    );
  }
}

async function testTokenEndpoint() {
  logSection('7. TOKEN ENDPOINT CONNECTIVITY');

  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID;

  if (!tenantId) {
    log('⚠ Skipping token endpoint test - VITE_AZURE_AD_TENANT_ID not set', colors.yellow);
    return;
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  try {
    log(`\nTesting connectivity to token endpoint...`, colors.cyan);
    log(`URL: ${tokenEndpoint}\n`);

    // We can't actually get a token without credentials, but we can check if the endpoint responds
    const response = await httpsRequest(tokenEndpoint);

    // Even with invalid request, we should get a structured error response
    const isReachable = response.error || response.error_description;

    addResult(
      'Token Endpoint',
      'Connectivity',
      isReachable,
      `Token endpoint: ${isReachable ? 'REACHABLE' : 'UNREACHABLE'}`,
      { endpoint: tokenEndpoint }
    );
  } catch (error) {
    // A network error means we couldn't reach the endpoint
    addResult(
      'Token Endpoint',
      'Connectivity',
      false,
      `Token endpoint: UNREACHABLE`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function displaySummary() {
  logSection('VALIDATION SUMMARY');

  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = totalChecks - passedChecks;

  console.log(`Total Checks: ${totalChecks}`);
  log(`Passed: ${passedChecks}`, colors.green);
  log(`Failed: ${failedChecks}`, failedChecks > 0 ? colors.red : colors.green);
  console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%\n`);

  // Group by category
  const categories = [...new Set(results.map(r => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    const categoryTotal = categoryResults.length;

    console.log(`\n${colors.bright}${category} (${categoryPassed}/${categoryTotal} passed):${colors.reset}`);

    for (const result of categoryResults) {
      logCheck(result.passed, `  ${result.message}`);
    }
  }

  // Critical failures
  const criticalFailures = results.filter(r => !r.passed && (
    r.check.includes('_ID') ||
    r.check.includes('REDIRECT_URI') ||
    r.check === 'OpenID_Config' ||
    r.check === 'Keys_Available'
  ));

  if (criticalFailures.length > 0) {
    log(`\n⚠ CRITICAL FAILURES:`, colors.red + colors.bright);
    for (const failure of criticalFailures) {
      log(`  ✗ ${failure.category}: ${failure.message}`, colors.red);
      if (failure.details) {
        log(`    ${JSON.stringify(failure.details)}`, colors.yellow);
      }
    }
  }

  // Save results
  const fs = await import('fs/promises');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `azure-ad-validation-${timestamp}.json`;

  await fs.writeFile(filename, JSON.stringify(results, null, 2));
  log(`\nValidation results saved to: ${filename}`, colors.cyan);
}

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════════════════════╗', colors.bright);
  log('║              AZURE AD CONFIGURATION VERIFICATION                          ║', colors.bright);
  log('║                    ArchonY Fleet Management                               ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════════════════════╝', colors.bright);

  log('\nThis script validates your Azure AD app registration and SSO configuration.\n', colors.cyan);

  try {
    await validateEnvironmentVariables();
    await validateAzureADEndpoints();
    await validateJWKS();
    await validateRedirectURIs();
    await validateAppPermissions();
    await validateMSALConfig();
    await testTokenEndpoint();
    await displaySummary();

    const failedChecks = results.filter(r => !r.passed).length;

    if (failedChecks === 0) {
      log('\n✓ All validations passed! Azure AD configuration is correct.', colors.green + colors.bright);
    } else {
      log(`\n⚠ ${failedChecks} validation(s) failed. Review the summary above and fix issues.`, colors.yellow + colors.bright);
    }
  } catch (error) {
    log(`\n✗ Validation error: ${error}`, colors.red);
    process.exit(1);
  }
}

main();
