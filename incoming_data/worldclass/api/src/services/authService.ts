
// REMOVE: const DEFAULT_PASSWORD = 'admin123';
// REPLACE WITH:
const JWT_SECRET = process.env.JWT_SECRET;
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
