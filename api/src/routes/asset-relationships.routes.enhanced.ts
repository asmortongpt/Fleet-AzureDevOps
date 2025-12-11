method
- `VehicleRepository` with a `getVehicleById` method
- `UserRepository` with a `getUserById` method

These repository classes would need to be implemented separately to encapsulate the database operations. Here's the complete refactored file:


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


This refactored version of the file implements the repository pattern by:

1. Importing the necessary repositories at the top of the file.
2. Replacing the `pool.query` call with repository methods.
3. Creating instances of the repositories within the route handler.
4. Using the `AssetRelationshipRepository` to fetch the asset relationships based on the query parameters.
5. Using the `VehicleRepository` and `UserRepository` to fetch additional data for each relationship.
6. Processing the relationships to include the additional data in the response.

Note that this refactoring assumes the existence of the following repository classes:

- `AssetRelationshipRepository` with a `getAssetRelationships` method
- `VehicleRepository` with a `getVehicleById` method
- `UserRepository` with a `getUserById` method

These repository classes would need to be implemented separately to encapsulate the database operations. The implementation of these repositories would depend on your specific database setup and ORM (if used).