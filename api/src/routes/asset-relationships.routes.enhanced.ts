Thank you for providing the refactored code. I'll now present the complete file with the requested changes, including the implementation of the `VehicleRepository` and `UserRepository` classes.

Here's the complete refactored file:


import { Router } from 'express';
import { z } from 'zod';

import { auditLog } from '../middleware/audit';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

// Import repositories
import { AssetRelationshipRepository } from '../repositories/AssetRelationshipRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Zod schema for query validation
const querySchema = z.object({
  parent_asset_id: z.string().optional(),
  child_asset_id: z.string().optional(),
  relationship_type: z.enum(['TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS']).optional(),
  active_only: z.boolean().default(true),
});

router.get(
  '/',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      // Validate query parameters
      const validatedQuery = querySchema.parse(req.query);

      // Initialize repositories
      const assetRelationshipRepository = new AssetRelationshipRepository();
      const vehicleRepository = new VehicleRepository();
      const userRepository = new UserRepository();

      // Fetch asset relationships
      const relationships = await assetRelationshipRepository.getAssetRelationships({
        tenantId: req.user!.tenant_id,
        parentAssetId: validatedQuery.parent_asset_id,
        childAssetId: validatedQuery.child_asset_id,
        relationshipType: validatedQuery.relationship_type,
        activeOnly: validatedQuery.active_only,
      });

      // Process relationships to include additional data
      const processedRelationships = await Promise.all(relationships.map(async (relationship) => {
        const [parentVehicle, childVehicle, createdByUser] = await Promise.all([
          vehicleRepository.getVehicleById(relationship.parent_asset_id),
          vehicleRepository.getVehicleById(relationship.child_asset_id),
          userRepository.getUserById(relationship.created_by),
        ]);

        return {
          ...relationship,
          parent_asset_name: parentVehicle ? `${parentVehicle.make} ${parentVehicle.model} (${parentVehicle.vin})` : null,
          parent_asset_type: parentVehicle ? parentVehicle.asset_type : null,
          child_asset_name: childVehicle ? `${childVehicle.make} ${childVehicle.model} (${childVehicle.vin})` : null,
          child_asset_type: childVehicle ? childVehicle.asset_type : null,
          created_by_name: createdByUser ? `${createdByUser.first_name} ${createdByUser.last_name}` : null,
        };
      }));

      res.json(processedRelationships);
    } catch (error) {
      console.error('Failed to get asset relationships:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;


Now, let's implement the `VehicleRepository` and `UserRepository` classes:


// File: ../repositories/VehicleRepository.ts

import { pool } from '../database';

export class VehicleRepository {
  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    const query = `
      SELECT id, make, model, vin, asset_type
      FROM vehicles
      WHERE id = $1
    `;
    const result = await pool.query(query, [vehicleId]);
    return result.rows[0] || null;
  }
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  vin: string;
  asset_type: string;
}



// File: ../repositories/UserRepository.ts

import { pool } from '../database';

export class UserRepository {
  async getUserById(userId: string): Promise<User | null> {
    const query = `
      SELECT id, first_name, last_name
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}


These repository classes encapsulate the database operations for vehicles and users, respectively. They use the `pool.query` method to interact with the database, which is assumed to be imported from a `../database` module.

Note that the `AssetRelationshipRepository` is not implemented here, as it was already being used in the original code. You would need to ensure that this repository is properly implemented in the `../repositories/AssetRelationshipRepository.ts` file.

This refactored version of the code now uses the repository pattern consistently throughout, improving the separation of concerns and making the code more modular and easier to maintain.