/**
 * JWT Configuration
 */

/**
 * Retrieve the JWT secret for a given tenant.
 * Currently uses a single global secret from environment variables.
 * In a multi-tenant setup with unique secrets, this would look up the secret from a database or vault.
 * 
 * @param tenantId - The ID of the tenant
 * @returns The JWT secret
 */
export async function getJwtSecret(tenantId: string): Promise<string> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }

    return secret;
}
