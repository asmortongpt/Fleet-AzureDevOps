import express from 'express';

import { PolicyViolationsController } from '../controllers/policy-violations.controller';

const router = express.Router();

/**
 * Policy Violations Routes
 * All routes under /api/policy-violations
 */

// Get all violations with filters
router.get('/', (req, res) => PolicyViolationsController.getViolations(req, res));

// Get violation statistics
router.get('/statistics', (req, res) => PolicyViolationsController.getStatistics(req, res));

// Get violation trends
router.get('/trends', (req, res) => PolicyViolationsController.getTrends(req, res));

// Export violations to CSV/PDF/Excel
router.post('/export', (req, res) => PolicyViolationsController.exportViolations(req, res));

// Generate compliance report
router.post('/compliance-report', (req, res) => PolicyViolationsController.generateComplianceReport(req, res));

// Get a single violation by ID
router.get('/:id', (req, res) => PolicyViolationsController.getViolationById(req, res));

// Create a new violation
router.post('/', (req, res) => PolicyViolationsController.createViolation(req, res));

// Resolve a violation
router.post('/:id/resolve', (req, res) => PolicyViolationsController.resolveViolation(req, res));

// Request override
router.post('/:id/override', (req, res) => PolicyViolationsController.requestOverride(req, res));

// Approve override (admin only)
router.post('/:id/approve-override', (req, res) => PolicyViolationsController.approveOverride(req, res));

// Get violation comments
router.get('/:id/comments', (req, res) => PolicyViolationsController.getComments(req, res));

// Add violation comment
router.post('/:id/comments', (req, res) => PolicyViolationsController.addComment(req, res));

export default router;
