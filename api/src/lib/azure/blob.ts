
import { BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from '@azure/storage-blob';

export interface SasOptions {
  containerName: string;
  blobName: string;
  permissions: string; // e.g. 'cw' create+write
  expiresInMinutes?: number;
  contentType?: string;
}

function getSharedKeyCredential() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountName || !accountKey) {
    throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME or AZURE_STORAGE_ACCOUNT_KEY');
  }
  return { accountName, credential: new StorageSharedKeyCredential(accountName, accountKey) };
}

export function getBlobServiceClient(): BlobServiceClient {
  const url = process.env.AZURE_STORAGE_BLOB_URL; // e.g. https://{account}.blob.core.windows.net
  const { accountName, credential } = getSharedKeyCredential();
  const serviceUrl = url || `https://${accountName}.blob.core.windows.net`;
  return new BlobServiceClient(serviceUrl, credential);
}

export function generateUploadSasUrl(opts: SasOptions): { url: string; expiresAt: string } {
  const { accountName, credential } = getSharedKeyCredential();
  const serviceUrl = process.env.AZURE_STORAGE_BLOB_URL || `https://${accountName}.blob.core.windows.net`;
  const expiresInMinutes = opts.expiresInMinutes ?? 30;
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: opts.containerName,
      blobName: opts.blobName,
      permissions: BlobSASPermissions.parse(opts.permissions),
      protocol: SASProtocol.Https,
      expiresOn,
      contentType: opts.contentType,
    },
    credential
  ).toString();

  const url = `${serviceUrl}/${opts.containerName}/${encodeURIComponent(opts.blobName)}?${sas}`;
  return { url, expiresAt: expiresOn.toISOString() };
}
