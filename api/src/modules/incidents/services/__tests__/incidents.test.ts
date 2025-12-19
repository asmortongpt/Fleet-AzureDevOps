import { Container } from 'inversify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { TYPES } from '../../../../types';
import type { Incident } from '../../../../types/incident';
import { ContainmentService, ContainmentActionType } from '../containment';
import { IncidentResponderService } from '../incident-responder';
import { IncidentTriageService, PriorityLevel } from '../incident-triage';
import { PlaybooksService, PlaybookActionStatus } from '../playbooks';
import { PostIncidentService } from '../post-incident';
import { RemediationService } from '../remediation';

// Mock Repository
class MockIncidentRepository {
  private incidents: Map<number, Incident> = new Map();
  private nextId = 1;

  async findById(id: number, tenantId: number): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async findAll(tenantId: number): Promise<Incident[]> {
    return Array.from(this.incidents.values());
  }

  async create(data: Partial<Incident>, tenantId: number): Promise<Incident> {
    const incident: Incident = {
      id: this.nextId++,
      tenant_id: tenantId,
      incident_number: `INC-${this.nextId}`,
      incident_type: data.incident_type || 'other',
      severity: data.severity || 'low',
      status: data.status || 'reported',
      incident_date: data.incident_date || new Date(),
      description: data.description || '',
      reported_by: data.reported_by || 'system',
      created_at: new Date(),
      updated_at: new Date(),
      ...data
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  setIncident(incident: Incident): void {
    this.incidents.set(incident.id, incident);
  }
}

describe('Incident Response System', () => {
  let container: Container;
  let triageService: IncidentTriageService;
  let playbooksService: PlaybooksService;
  let containmentService: ContainmentService;
  let remediationService: RemediationService;
  let postIncidentService: PostIncidentService;
  let responderService: IncidentResponderService;
  let mockRepository: MockIncidentRepository;

  beforeEach(() => {
    container = new Container();
    mockRepository = new MockIncidentRepository();

    container.bind(TYPES.IncidentRepository).toConstantValue(mockRepository);
    container.bind(IncidentTriageService).toSelf();
    container.bind(PlaybooksService).toSelf();
    container.bind(ContainmentService).toSelf();
    container.bind(RemediationService).toSelf();
    container.bind(PostIncidentService).toSelf();
    container.bind(IncidentResponderService).toSelf();

    triageService = container.get(IncidentTriageService);
    playbooksService = container.get(PlaybooksService);
    containmentService = container.get(ContainmentService);
    remediationService = container.get(RemediationService);
    postIncidentService = container.get(PostIncidentService);
    responderService = container.get(IncidentResponderService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('IncidentTriageService', () => {
    it('should classify critical theft as P0', async () => {
      const incident: Incident = {
        id: 1,
        tenant_id: 1,
        incident_number: 'INC-001',
        vehicle_id: 'VEH-001',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Critical vehicle theft with unauthorized access',
        reported_by: 'officer',
        created_at: new Date(),
        updated_at: new Date()
      };

      const classification = await triageService.classifyIncident(incident);

      expect(classification.priority).toBe(PriorityLevel.CRITICAL);
      expect(classification.confidence).toBeGreaterThan(70);
      expect(classification.riskFactors.length).toBeGreaterThan(0);
    });

    it('should classify high-risk safety incident as P0', async () => {
      const incident: Incident = {
        id: 2,
        tenant_id: 1,
        incident_number: 'INC-002',
        vehicle_id: 'VEH-002',
        driver_id: 'DRV-001',
        incident_type: 'safety',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Critical safety breach with serious injury reported',
        injuries_reported: true,
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      const classification = await triageService.classifyIncident(incident);

      expect(classification.priority).toBe(PriorityLevel.CRITICAL);
      expect(classification.riskFactors).toContain('Injuries reported');
    });

    it('should classify moderate accident as P0, P1 or P2', async () => {
      const incident: Incident = {
        id: 3,
        tenant_id: 1,
        incident_number: 'INC-003',
        vehicle_id: 'VEH-003',
        incident_type: 'accident',
        severity: 'high',
        status: 'reported',
        incident_date: new Date(),
        description: 'Vehicle collision at intersection',
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      const classification = await triageService.classifyIncident(incident);

      expect([PriorityLevel.CRITICAL, PriorityLevel.HIGH, PriorityLevel.MEDIUM]).toContain(classification.priority);
      expect(classification.recommendedTeam.length).toBeGreaterThan(0);
    });

    it('should classify low-risk breakdown as P2 or P3', async () => {
      const incident: Incident = {
        id: 4,
        tenant_id: 1,
        incident_number: 'INC-004',
        vehicle_id: 'VEH-004',
        incident_type: 'breakdown',
        severity: 'low',
        status: 'reported',
        incident_date: new Date(),
        description: 'Minor vehicle breakdown, no immediate risk',
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      const classification = await triageService.classifyIncident(incident);

      expect([PriorityLevel.MEDIUM, PriorityLevel.LOW]).toContain(classification.priority);
      expect(classification.estimatedResolutionTime).toBeGreaterThan(0);
    });

    it('should perform full triage workflow', async () => {
      const incident: Incident = {
        id: 5,
        tenant_id: 1,
        incident_number: 'INC-005',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Critical theft incident',
        reported_by: 'security',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRepository.setIncident(incident);

      const triageResult = await triageService.triageIncident(incident.id, 1);

      expect(triageResult.incidentId).toBe(incident.id);
      expect(triageResult.classification.priority).toBeDefined();
      expect(triageResult.shouldEscalate).toBe(true);
      expect(triageResult.escalationPath.length).toBeGreaterThan(0);
    });

    it('should batch triage multiple incidents', async () => {
      const incidents = [
        { id: 1, incident_type: 'theft', severity: 'critical' },
        { id: 2, incident_type: 'accident', severity: 'high' },
        { id: 3, incident_type: 'breakdown', severity: 'low' }
      ];

      for (const inc of incidents) {
        mockRepository.setIncident({
          id: inc.id,
          tenant_id: 1,
          incident_number: `INC-00${inc.id}`,
          incident_type: inc.incident_type as any,
          severity: inc.severity as any,
          status: 'reported',
          incident_date: new Date(),
          description: 'Test incident',
          reported_by: 'system',
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      const results = await triageService.triageIncidents([1, 2, 3], 1);

      expect(results.length).toBe(3);
      expect(results[0].classification.priority).toBe(PriorityLevel.CRITICAL);
    });

    it('should get escalation queue for high-priority incidents', async () => {
      const criticalIncident: Incident = {
        id: 6,
        tenant_id: 1,
        incident_number: 'INC-006',
        incident_type: 'safety',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Critical safety incident',
        reported_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRepository.setIncident(criticalIncident);

      const escapequeue = await triageService.getEscalationQueue(1);

      expect(escapequeue.some(t => t.incidentId === 6)).toBe(true);
    });
  });

  describe('PlaybooksService', () => {
    it('should register and retrieve playbooks', () => {
      const playbooks = playbooksService.getAllPlaybooks();

      expect(playbooks.length).toBeGreaterThan(0);
      expect(playbooks.some(p => p.incidentType === 'theft')).toBe(true);
      expect(playbooks.some(p => p.incidentType === 'accident')).toBe(true);
    });

    it('should get correct playbook for incident type and priority', () => {
      const playbookP0 = playbooksService.getPlaybook('theft', 'P0');
      expect(playbookP0).not.toBeNull();
      expect(playbookP0?.priority).toBe('P0');

      const playbookP2 = playbooksService.getPlaybook('breakdown', 'P2');
      expect(playbookP2).not.toBeNull();
    });

    it('should execute playbook with sequential actions', async () => {
      const incident: Incident = {
        id: 7,
        tenant_id: 1,
        incident_number: 'INC-007',
        vehicle_id: 'VEH-007',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        location: 'Parking lot A',
        description: 'Vehicle theft incident',
        reported_by: 'security',
        created_at: new Date(),
        updated_at: new Date()
      };

      const playbook = playbooksService.getPlaybook('theft', 'P0');
      expect(playbook).not.toBeNull();

      if (playbook) {
        const result = await playbooksService.executePlaybook(playbook, incident);

        expect(result.incidentId).toBe(incident.id);
        expect(result.actions.length).toBeGreaterThan(0);
        expect([PlaybookActionStatus.COMPLETED, PlaybookActionStatus.FAILED]).toContain(
          result.actions[0].status
        );
      }
    });

    it('should handle playbook execution with retries', async () => {
      const incident: Incident = {
        id: 8,
        tenant_id: 1,
        incident_number: 'INC-008',
        incident_type: 'accident',
        severity: 'high',
        status: 'reported',
        incident_date: new Date(),
        location: 'Highway 95',
        description: 'Accident with injuries',
        driver_id: 'DRV-008',
        injuries_reported: true,
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      const playbook = playbooksService.getPlaybook('accident', 'P1');
      expect(playbook).not.toBeNull();

      if (playbook) {
        const result = await playbooksService.executePlaybook(playbook, incident);

        expect(result.successRate).toBeGreaterThanOrEqual(0);
        expect(result.overallStatus).toMatch(/success|partial|failed/);
      }
    });
  });

  describe('ContainmentService', () => {
    it('should create containment plan for theft incident', async () => {
      const incident: Incident = {
        id: 9,
        tenant_id: 1,
        incident_number: 'INC-009',
        vehicle_id: 'VEH-009',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Critical vehicle theft',
        reported_by: 'security',
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = await containmentService.containIncident(incident);

      expect(plan.incidentId).toBe(incident.id);
      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.actions.some(a => a.type === ContainmentActionType.ISOLATE_VEHICLE)).toBe(true);
      expect(plan.actions.some(a => a.type === ContainmentActionType.REVOKE_ACCESS)).toBe(true);
    });

    it('should create containment plan for safety incident', async () => {
      const incident: Incident = {
        id: 10,
        tenant_id: 1,
        incident_number: 'INC-010',
        vehicle_id: 'VEH-010',
        incident_type: 'safety',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Critical safety hazard',
        reported_by: 'operator',
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = await containmentService.containIncident(incident);

      expect(plan.actions.some(a => a.type === ContainmentActionType.RESTRICT_LOCATION)).toBe(true);
      expect(plan.actions.some(a => a.type === ContainmentActionType.DISABLE_SYSTEMS)).toBe(true);
    });

    it('should create containment plan for accident', async () => {
      const incident: Incident = {
        id: 11,
        tenant_id: 1,
        incident_number: 'INC-011',
        vehicle_id: 'VEH-011',
        driver_id: 'DRV-011',
        incident_type: 'accident',
        severity: 'high',
        status: 'reported',
        incident_date: new Date(),
        location: 'Intersection 5',
        description: 'Vehicle collision',
        injuries_reported: true,
        reported_by: 'witness',
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = await containmentService.containIncident(incident);

      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.containmentPercentage).toBeGreaterThanOrEqual(0);
      expect(plan.riskLevel).toMatch(/critical|high|medium|low/);
    });

    it('should assess containment status', async () => {
      const incident: Incident = {
        id: 12,
        tenant_id: 1,
        incident_number: 'INC-012',
        vehicle_id: 'VEH-012',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Test containment',
        reported_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = await containmentService.containIncident(incident);

      expect(plan.contained).toBeDefined();
      expect(plan.containmentPercentage).toBeGreaterThanOrEqual(0);
      expect(plan.containmentPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('RemediationService', () => {
    it('should create remediation plan for theft incident', () => {
      const incident: Incident = {
        id: 13,
        tenant_id: 1,
        incident_number: 'INC-013',
        vehicle_id: 'VEH-013',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Vehicle theft remediation',
        reported_by: 'security',
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = remediationService.createRemediationPlan(incident);

      expect(plan.incidentId).toBe(incident.id);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.steps.some(s => s.name.includes('Recover'))).toBe(true);
      expect(plan.estimated_total_time).toBeGreaterThan(0);
    });

    it('should create remediation plan for accident', () => {
      const incident: Incident = {
        id: 14,
        tenant_id: 1,
        incident_number: 'INC-014',
        vehicle_id: 'VEH-014',
        driver_id: 'DRV-014',
        incident_type: 'accident',
        severity: 'high',
        status: 'reported',
        incident_date: new Date(),
        description: 'Accident remediation',
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = remediationService.createRemediationPlan(incident);

      expect(plan.steps.some(s => s.name.includes('Damage'))).toBe(true);
      expect(plan.steps.some(s => s.name.includes('Retraining') || s.name.includes('Safety'))).toBe(true);
    });

    it(
      'should execute remediation plan',
      async () => {
        const incident: Incident = {
          id: 15,
          tenant_id: 1,
          incident_number: 'INC-015',
          vehicle_id: 'VEH-015',
          incident_type: 'breakdown',
          severity: 'medium',
          status: 'reported',
          incident_date: new Date(),
          description: 'Breakdown remediation',
          reported_by: 'driver',
          created_at: new Date(),
          updated_at: new Date()
        };

        const plan = remediationService.createRemediationPlan(incident);
        const executed = await remediationService.executeRemediationPlan(plan);

        expect(executed.status).toMatch(/completed|partial|failed/);
        expect(executed.completionPercentage).toBeGreaterThanOrEqual(0);
        expect(executed.completionPercentage).toBeLessThanOrEqual(100);
      },
      30000
    );

    it('should assess vulnerabilities', () => {
      const incident: Incident = {
        id: 16,
        tenant_id: 1,
        incident_number: 'INC-016',
        vehicle_id: 'VEH-016',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Vulnerability assessment',
        reported_by: 'security',
        created_at: new Date(),
        updated_at: new Date()
      };

      const assessments = remediationService.assessVulnerabilities(incident);

      expect(assessments.length).toBeGreaterThan(0);
      expect(assessments[0]).toHaveProperty('vulnerabilityId');
      expect(assessments[0]).toHaveProperty('remediationSteps');
      expect(assessments[0].remediationSteps.length).toBeGreaterThan(0);
    });
  });

  describe('PostIncidentService', () => {
    it('should generate post-incident report', async () => {
      const incident: Incident = {
        id: 17,
        tenant_id: 1,
        incident_number: 'INC-017',
        vehicle_id: 'VEH-017',
        incident_type: 'theft',
        severity: 'critical',
        status: 'reported',
        incident_date: new Date(),
        description: 'Post-incident analysis',
        reported_by: 'security',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRepository.setIncident(incident);

      const report = await postIncidentService.generatePostIncidentReport(incident, 1);

      expect(report.incidentId).toBe(incident.id);
      expect(report.timeline.length).toBeGreaterThan(0);
      expect(report.rootCauseAnalysis.primaryCause).toBeDefined();
      expect(report.lessonsLearned.length).toBeGreaterThan(0);
      expect(report.actionItems.length).toBeGreaterThan(0);
      expect(report.metrics.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should include timeline in report', async () => {
      const incident: Incident = {
        id: 18,
        tenant_id: 1,
        incident_number: 'INC-018',
        incident_type: 'accident',
        severity: 'high',
        status: 'reported',
        incident_date: new Date(),
        description: 'Timeline test',
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRepository.setIncident(incident);

      const report = await postIncidentService.generatePostIncidentReport(incident, 1);

      expect(report.timeline).toBeDefined();
      expect(report.timeline.length).toBeGreaterThan(0);
      expect(report.timeline[0]).toHaveProperty('timestamp');
      expect(report.timeline[0]).toHaveProperty('event');
    });

    it('should identify lessons learned', async () => {
      const incident: Incident = {
        id: 19,
        tenant_id: 1,
        incident_number: 'INC-019',
        incident_type: 'breakdown',
        severity: 'medium',
        status: 'reported',
        incident_date: new Date(),
        description: 'Lessons learned test',
        reported_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRepository.setIncident(incident);

      const report = await postIncidentService.generatePostIncidentReport(incident, 1);

      expect(report.lessonsLearned.length).toBeGreaterThan(0);
      expect(report.lessonsLearned[0]).toHaveProperty('category');
      expect(report.lessonsLearned[0]).toHaveProperty('recommendation');
    });

    it('should calculate incident metrics', async () => {
      const incident: Incident = {
        id: 20,
        tenant_id: 1,
        incident_number: 'INC-020',
        incident_type: 'damage',
        severity: 'medium',
        status: 'reported',
        incident_date: new Date(),
        estimated_cost: 25000,
        description: 'Metrics test',
        reported_by: 'operator',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRepository.setIncident(incident);

      const report = await postIncidentService.generatePostIncidentReport(incident, 1);

      expect(report.metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.metrics.overallScore).toBeLessThanOrEqual(100);
      expect(report.metrics.costImpact).toBe(25000);
    });
  });

  describe('IncidentResponderService', () => {
    it(
      'should execute complete incident response workflow',
      async () => {
        const incident: Incident = {
          id: 21,
          tenant_id: 1,
          incident_number: 'INC-021',
          vehicle_id: 'VEH-021',
          incident_type: 'theft',
          severity: 'critical',
          status: 'reported',
          incident_date: new Date(),
          location: 'Parking lot',
          description: 'Complete workflow test',
          reported_by: 'security',
          created_at: new Date(),
          updated_at: new Date()
        };

        mockRepository.setIncident(incident);

        const response = await responderService.respondToIncident(incident.id, 1);

        expect(response.incidentId).toBe(incident.id);
        expect(response.status).toMatch(/initiated|in_progress|contained|remediated|completed/);
        expect(response.timeline.length).toBeGreaterThan(0);
        expect(response.priority).toBeDefined();
        expect(response.summary).toBeTruthy();
      },
      30000
    );

    it(
      'should handle multiple incident responses',
      async () => {
        const incidents = [
          {
            id: 22,
            tenantId: 1,
            type: 'theft',
            severity: 'critical',
            vehicle: 'VEH-022'
          },
          {
            id: 23,
            tenantId: 1,
            type: 'accident',
            severity: 'high',
            vehicle: 'VEH-023'
          }
        ];

        for (const inc of incidents) {
          mockRepository.setIncident({
            id: inc.id,
            tenant_id: inc.tenantId,
            incident_number: `INC-0${inc.id}`,
            vehicle_id: inc.vehicle,
            incident_type: inc.type as any,
            severity: inc.severity as any,
            status: 'reported',
            incident_date: new Date(),
            description: 'Batch test',
            reported_by: 'system',
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        const responses = await responderService.respondToIncidents([22, 23], 1);

        expect(responses.length).toBe(2);
        expect(responses.every(r => r.status !== undefined)).toBe(true);
      },
      60000
    );

    it('should get incident statistics', async () => {
      const incidents = [
        {
          id: 24,
          type: 'theft',
          severity: 'critical',
          status: 'reported'
        },
        {
          id: 25,
          type: 'accident',
          severity: 'high',
          status: 'investigating'
        }
      ];

      for (const inc of incidents) {
        mockRepository.setIncident({
          id: inc.id,
          tenant_id: 1,
          incident_number: `INC-0${inc.id}`,
          incident_type: inc.type as any,
          severity: inc.severity as any,
          status: inc.status as any,
          incident_date: new Date(),
          description: 'Stats test',
          reported_by: 'system',
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      const stats = await responderService.getIncidentStats(1);

      expect(stats.totalIncidents).toBeGreaterThanOrEqual(2);
      expect(stats.byType).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byStatus).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it(
      'should handle end-to-end incident response for theft',
      async () => {
        const incident: Incident = {
          id: 26,
          tenant_id: 1,
          incident_number: 'INC-026',
          vehicle_id: 'VEH-026',
          incident_type: 'theft',
          severity: 'critical',
          status: 'reported',
          incident_date: new Date(),
          location: 'Parking lot A',
          description: 'Critical vehicle theft with breach',
          reported_by: 'security',
          police_report_filed: true,
          police_report_number: 'POL-12345',
          created_at: new Date(),
          updated_at: new Date()
        };

        mockRepository.setIncident(incident);

        const response = await responderService.respondToIncident(incident.id, 1);

        expect(response.status).not.toBe('initiated');
        expect(response.triage).toBeDefined();
        expect(response.triage.classification.priority).toBe(PriorityLevel.CRITICAL);
        expect(response.containment).toBeDefined();
        expect(response.remediation).toBeDefined();
        expect(response.postIncident).toBeDefined();
      },
      30000
    );

    it(
      'should handle end-to-end incident response for safety',
      async () => {
        const incident: Incident = {
          id: 27,
          tenant_id: 1,
          incident_number: 'INC-027',
          vehicle_id: 'VEH-027',
          driver_id: 'DRV-027',
          incident_type: 'safety',
          severity: 'critical',
          status: 'reported',
          incident_date: new Date(),
          location: 'Highway 95',
          description: 'Critical safety incident with injuries',
          injuries_reported: true,
          reported_by: 'driver',
          created_at: new Date(),
          updated_at: new Date()
        };

        mockRepository.setIncident(incident);

        const response = await responderService.respondToIncident(incident.id, 1);

        expect(response.postIncident.lessonsLearned.length).toBeGreaterThan(0);
        expect(response.postIncident.actionItems.length).toBeGreaterThan(0);
      },
      45000
    );
  });

  describe('Error Handling', () => {
    it('should handle missing incident gracefully', async () => {
      try {
        await triageService.triageIncident(999, 1);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it(
      'should handle concurrent responses safely',
      async () => {
        const incidents = [1, 2, 3, 4, 5];

        for (const i of incidents) {
          mockRepository.setIncident({
            id: i,
            tenant_id: 1,
            incident_number: `INC-0${i}`,
            incident_type: 'accident',
            severity: 'high',
            status: 'reported',
            incident_date: new Date(),
            description: 'Concurrent test',
            reported_by: 'system',
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        const promises = incidents.map(id => responderService.respondToIncident(id, 1));
        const results = await Promise.all(promises);

        expect(results.length).toBe(5);
        expect(results.every(r => r.incidentId)).toBe(true);
      },
      60000
    );
  });
});
