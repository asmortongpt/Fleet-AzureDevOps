// File: telemetry.ts

import { Request, Response } from 'express';
import { TelemetryRepository } from '../repositories/telemetry.repository';

const telemetryRepository = new TelemetryRepository();

export const getTelemetry = async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const [data, total] = await telemetryRepository.getTelemetryData(tenantId, parseInt(limit as string, 10), parseInt(offset as string, 10));
    res.json({ data, total, limit: parseInt(limit as string, 10), offset: parseInt(offset as string, 10) });
  } catch (error) {
    console.error('Error fetching telemetry data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTelemetryById = async (req: Request, res: Response) => {
  const { id, tenantId } = req.params;

  try {
    const telemetry = await telemetryRepository.getTelemetryById(id, tenantId);
    if (!telemetry) {
      return res.status(404).json({ error: 'Telemetry not found' });
    }
    res.json(telemetry);
  } catch (error) {
    console.error('Error fetching telemetry by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTelemetry = async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const telemetryData = req.body;

  try {
    const newTelemetry = await telemetryRepository.createTelemetry(telemetryData, tenantId);
    res.status(201).json(newTelemetry);
  } catch (error) {
    console.error('Error creating telemetry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTelemetry = async (req: Request, res: Response) => {
  const { id, tenantId } = req.params;
  const telemetryData = req.body;

  try {
    const updatedTelemetry = await telemetryRepository.updateTelemetry(id, telemetryData, tenantId);
    if (!updatedTelemetry) {
      return res.status(404).json({ error: 'Telemetry not found' });
    }
    res.json(updatedTelemetry);
  } catch (error) {
    console.error('Error updating telemetry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteTelemetry = async (req: Request, res: Response) => {
  const { id, tenantId } = req.params;

  try {
    const deleted = await telemetryRepository.deleteTelemetry(id, tenantId);
    if (!deleted) {
      return res.status(404).json({ error: 'Telemetry not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting telemetry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};