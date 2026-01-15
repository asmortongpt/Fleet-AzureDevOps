import express from 'express';

import { userService } from '../services/UserService';

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = (req as any).user;

    const data = await userService.getUserDetails(
      parseInt(id),
      Number(tenant_id)
    );

    res.json(data);
  } catch (error) {
    next(error); // Let error middleware handle it
  }
});

export default router;