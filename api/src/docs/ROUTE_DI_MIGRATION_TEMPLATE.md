# Route DI Migration Template

## Before (Direct DB Access)
\`\`\`typescript
import pool from '../config/database'

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE tenant_id = $1',
    [req.user.tenant_id]
  )
  res.json(result.rows)
})
\`\`\`

## After (DI Container)
\`\`\`typescript
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError } from '../errors/app-error'

router.get('/', asyncHandler(async (req, res) => {
  const vehicleService = container.resolve('vehicleService')
  const vehicles = await vehicleService.getVehicles(req.user.tenant_id)
  res.json(vehicles)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const vehicleService = container.resolve('vehicleService')
  const vehicle = await vehicleService.getVehicle(req.params.id, req.user.tenant_id)
  
  if (!vehicle) {
    throw new NotFoundError(\`Vehicle \${req.params.id} not found\`)
  }
  
  res.json(vehicle)
}))
\`\`\`

## Migration Checklist
- [ ] Replace pool imports with container imports
- [ ] Resolve service from container
- [ ] Wrap handler with asyncHandler
- [ ] Remove try-catch (let global handler handle it)
- [ ] Use custom error classes (NotFoundError, ValidationError, etc.)
- [ ] Test endpoint with Postman/curl
