
export const config = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  azureKeyVaultUrl: process.env.AZURE_KEY_VAULT_URL
};
