
import crypto from 'crypto';

import { Request, Response } from 'express';

import { generateUploadSasUrl } from '../lib/azure/blob';
import { enqueueScanProcessing } from '../lib/azure/serviceBus';
import { scanSessionRepository } from '../repositories/scan-session.repository';

function sha256(buf: Buffer) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export const scanSessionsController = {
  async create(req: Request, res: Response) {
    const { vehicleId, captureType } = req.body || {};
    if (!vehicleId || !captureType) return res.status(400).json({ error: 'vehicleId and captureType required' });
    const session = await scanSessionRepository.create({ vehicleId, captureType });
    return res.status(201).json(session);
  },

  async get(req: Request, res: Response) {
    const session = await scanSessionRepository.getById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    return res.json(session);
  },

  async listByVehicle(req: Request, res: Response) {
    const sessions = await scanSessionRepository.listByVehicle(req.params.vehicleId);
    return res.json(sessions);
  },

  async createUploadCredentials(req: Request, res: Response) {
    const { files } = req.body || {};
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'files array required' });
    const session = await scanSessionRepository.getById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });

    const container = process.env.AZURE_STORAGE_RAW_CONTAINER || 'scans-raw';
    const creds = files.map((f: any) => {
      const blobName = `${session.id}/raw/${f.name}`;
      const { url, expiresAt } = generateUploadSasUrl({ containerName: container, blobName, permissions: 'cw', contentType: f.contentType || 'application/octet-stream' });
      return { name: f.name, blobName, container, uploadUrl: url, expiresAt };
    });
    await scanSessionRepository.update(session.id, { status: 'uploading', rawAssets: creds.map((c:any)=>({name:c.name, container, blobName:c.blobName, contentType: files.find((x:any)=>x.name===c.name)?.contentType||'application/octet-stream'})) });
    res.json({ sessionId: session.id, uploads: creds });
  },

  async uploadComplete(req: Request, res: Response) {
    const session = await scanSessionRepository.getById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    // in real system, we would verify blobs exist and compute server-side hashes with BlobClient downloads or Content-MD5.
    const updated = await scanSessionRepository.update(session.id, { status: 'uploaded' });
    await enqueueScanProcessing(session.id);
    res.json({ ...updated, enqueued: true });
  },

  async update(req: Request, res: Response) {
    const patch = req.body || {};
    const updated = await scanSessionRepository.update(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  }
};
