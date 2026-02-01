// Type declarations for Azure SDK packages
declare module '@azure/identity' {
    export class DefaultAzureCredential {
        constructor(options?: Record<string, unknown>);
    }
}

declare module '@azure/keyvault-secrets' {
    export interface KeyVaultSecret {
        value?: string;
        name: string;
        properties: Record<string, unknown>;
    }

    export interface SecretProperties {
        name: string;
        vaultUrl: string;
        version?: string;
        enabled?: boolean;
        createdOn?: Date;
        updatedOn?: Date;
    }

    export class SecretClient {
        constructor(vaultUrl: string, credential: unknown, options?: Record<string, unknown>);
        getSecret(secretName: string, options?: Record<string, unknown>): Promise<KeyVaultSecret>;
        listPropertiesOfSecrets(options?: Record<string, unknown>): AsyncIterableIterator<SecretProperties>;
    }
}
