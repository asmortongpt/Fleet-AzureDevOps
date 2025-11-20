/**
 * Example Routes with Dependency Injection
 *
 * This file demonstrates how to use the DI container in route handlers.
 *
 * Key Patterns:
 * 1. Resolve services from req.container (scoped per request)
 * 2. No direct service imports (use container instead)
 * 3. Easy to test (mock the container)
 * 4. Clear dependency requirements
 */

import { Router, Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { DIContainer } from '../container'

const router = Router()

/**
 * Extended Request type that includes the DI container
 * This is set by the containerMiddleware in server.ts
 */
interface RequestWithContainer extends Request {
  container: DIContainer
  user?: any
}

/**
 * @openapi
 * /api/example-di/vehicle-count:
 *   get:
 *     summary: Get vehicle count using DI service
 *     description: Demonstrates dependency injection in route handlers
 *     tags:
 *       - Examples
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/vehicle-count', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Cast to our extended request type
    const reqWithContainer = req as RequestWithContainer

    // Resolve the service from the container
    // This gives us a fresh instance for this request (SCOPED lifetime)
    const exampleService = reqWithContainer.container.resolve('exampleDIService')

    // Use the service
    const count = await exampleService.getVehicleCount()

    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('Error in vehicle-count route:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vehicle count'
    })
  }
})

/**
 * @openapi
 * /api/example-di/vehicle-action/{vehicleId}:
 *   post:
 *     summary: Perform action on vehicle using DI service
 *     description: Demonstrates dependency injection with parameterized requests
 *     tags:
 *       - Examples
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Action performed successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.post('/vehicle-action/:vehicleId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const reqWithContainer = req as RequestWithContainer
    const vehicleId = parseInt(req.params.vehicleId, 10)

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vehicle ID'
      })
    }

    // Resolve service from container
    const exampleService = reqWithContainer.container.resolve('exampleDIService')

    // Perform action
    const result = await exampleService.performAction(vehicleId)

    if (!result.success) {
      return res.status(404).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Error in vehicle-action route:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to perform action'
    })
  }
})

/**
 * @openapi
 * /api/example-di/test-di:
 *   get:
 *     summary: Test DI container availability
 *     description: Verifies that the DI container is properly configured
 *     tags:
 *       - Examples
 *     responses:
 *       200:
 *         description: DI container is working
 */
router.get('/test-di', async (req: Request, res: Response) => {
  try {
    const reqWithContainer = req as RequestWithContainer

    // Test container availability
    const hasContainer = !!reqWithContainer.container
    const hasExampleService = hasContainer && !!reqWithContainer.container.resolve

    // Try to resolve services
    let servicesAvailable: string[] = []
    if (hasContainer) {
      try {
        reqWithContainer.container.resolve('exampleDIService')
        servicesAvailable.push('exampleDIService')
      } catch (e) {
        // Service not available
      }

      try {
        reqWithContainer.container.resolve('dispatchService')
        servicesAvailable.push('dispatchService')
      } catch (e) {
        // Service not available
      }

      try {
        reqWithContainer.container.resolve('documentService')
        servicesAvailable.push('documentService')
      } catch (e) {
        // Service not available
      }
    }

    res.json({
      success: true,
      diContainer: {
        available: hasContainer,
        canResolve: hasExampleService,
        servicesAvailable
      },
      message: hasContainer
        ? 'DI container is properly configured'
        : 'DI container is not available - ensure containerMiddleware is registered in server.ts'
    })
  } catch (error) {
    console.error('Error testing DI:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to test DI container'
    })
  }
})

/**
 * Example of using multiple services together
 * This shows how to compose services for complex operations
 */
router.post('/complex-operation/:vehicleId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const reqWithContainer = req as RequestWithContainer
    const vehicleId = parseInt(req.params.vehicleId, 10)

    // Resolve multiple services
    const exampleService = reqWithContainer.container.resolve('exampleDIService')
    const documentService = reqWithContainer.container.resolve('documentService')
    const logger = reqWithContainer.container.resolve('logger')

    logger.info(`Starting complex operation for vehicle ${vehicleId}`)

    // Use multiple services in coordination
    const actionResult = await exampleService.performAction(vehicleId)

    if (!actionResult.success) {
      return res.status(404).json(actionResult)
    }

    // Could also use documentService here
    // const documents = await documentService.listDocuments({ vehicleId: vehicleId.toString() })

    logger.info(`Complex operation completed for vehicle ${vehicleId}`)

    res.json({
      success: true,
      message: 'Complex operation completed',
      actionResult
    })
  } catch (error) {
    console.error('Error in complex operation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to complete complex operation'
    })
  }
})

export default router
