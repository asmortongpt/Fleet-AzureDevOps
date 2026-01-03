import express from 'express';

import { PolicyViolationsController } from '../controllers/policy-violations.controller';

const router = express.Router();

/**
 * Policy Violations Routes
 * All routes under /api/policy-violations
 */

// Get all violations with filters
router.get('/', PolicyViolationsController.getViolations);

// Get violation statistics
router.get('/statistics', PolicyViolationsController.getStatistics);

// Get violation trends
router.get('/trends', PolicyViolationsController.getTrends);

// Export violations to CSV/PDF/Excel
router.post('/export', PolicyViolationsController.exportViolations);

// Generate compliance report
router.post('/compliance-report', PolicyViolationsController.generateComplianceReport);

// Get a single violation by ID
router.get('/:id', PolicyViolationsController.getViolationById);

// Create a new violation
router.post('/', PolicyViolationsController.createViolation);

// Resolve a violation
router.post('/:id/resolve', PolicyViolationsController.resolveViolation);

// Request override
router.post('/:id/override', PolicyViolationsController.requestOverride);

// Approve override (admin only)
router.post('/:id/approve-override', PolicyViolationsController.approveOverride);

// Get violation comments
router.get('/:id/comments', PolicyViolationsController.getComments);

// Add violation comment
router.post('/:id/comments', PolicyViolationsController.addComment);

export default router;
