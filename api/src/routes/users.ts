import express from 'express';
import { userService } from '../services/UserService';
import { NotFoundError } from '../errors/NotFoundError';

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const data = await userService.getUserDetails(
      parseInt(id),
      tenant_id
    );

    res.json(data);
  } catch (error) {
    next(error); // Let error middleware handle it
  }
});

export default router;