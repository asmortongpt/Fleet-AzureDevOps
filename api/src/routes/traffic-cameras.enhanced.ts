Thank you for the detailed review and confirmation that all 6 queries have been replaced with repository methods. I'll provide the complete refactored `traffic-cameras.enhanced.ts` file as requested, ensuring that all database operations are now handled through the `TrafficCameraRepository` class.

Here's the complete `traffic-cameras.enhanced.ts` file:


import express, { Request, Response } from 'express';
import { TrafficCameraRepository } from './traffic-camera-repository';

const router = express.Router();
const trafficCameraRepository = new TrafficCameraRepository();

// GET /api/traffic-cameras
router.get('/', async (req: Request, res: Response) => {
  try {
    const cameras = await trafficCameraRepository.getAllCameras();
    res.json(cameras);
  } catch (error) {
    console.error('Error fetching all traffic cameras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/traffic-cameras/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid camera ID' });
  }

  try {
    const camera = await trafficCameraRepository.getCameraById(id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    res.json(camera);
  } catch (error) {
    console.error('Error fetching traffic camera by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/traffic-cameras/meta/counties
router.get('/meta/counties', async (req: Request, res: Response) => {
  try {
    const counties = await trafficCameraRepository.getCountiesWithCameraCounts();
    res.json(counties);
  } catch (error) {
    console.error('Error fetching counties with camera counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/traffic-cameras/meta/roads
router.get('/meta/roads', async (req: Request, res: Response) => {
  try {
    const roads = await trafficCameraRepository.getRoadsWithCameraCounts();
    res.json(roads);
  } catch (error) {
    console.error('Error fetching roads with camera counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/traffic-cameras/sync
router.post('/sync', async (req: Request, res: Response) => {
  const cameras = req.body;
  if (!Array.isArray(cameras)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    await trafficCameraRepository.upsertCamera(cameras);
    res.status(201).json({ message: 'Cameras synced successfully' });
  } catch (error) {
    console.error('Error syncing traffic cameras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


This refactored version of `traffic-cameras.enhanced.ts` now uses the `TrafficCameraRepository` class for all database operations, eliminating the need for any direct `pool.query` calls. The repository methods are called within each route handler, ensuring that all database interactions are abstracted away from the router logic.

Please note that this file assumes the existence of a separate `traffic-camera-repository.ts` file that contains the implementation of the `TrafficCameraRepository` class. If you need the implementation of that class as well, please let me know, and I'll be happy to provide it.