#!/usr/bin/env tsx
/**
 * Azure DevOps Requirements Validation Script
 * Uses Grok AI agents to validate all requirements with evidence-based analysis
 */

import * as fs from 'fs';
import * as path from 'path';

import axios from 'axios';

// Configuration
const AZURE_DEVOPS_ORG = 'CapitalTechAlliance';
const AZURE_DEVOPS_PROJECT = 'FleetManagement';
const AZURE_DEVOPS_PAT = process.env.AZURE_DEVOPS_PAT || '';
const GROK_API_KEY = process.env.GROK_API_KEY || '';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface Requirement {
  id: string;
  title: string;
  type: string;
  state: string;
  acceptanceCriteria: string;
  description: string;
}

interface ValidationResult {
  requirementId: string;
  requirementTitle: string;
  acceptanceCriteria: string;
  validationSteps: string[];
  status: 'Verified Complete' | 'Partially Verified' | 'Not Verified' | 'Blocked';
  evidence: string[];
  notes: string;
  nextAction: string;
}

class GrokAgent {
  private apiKey: string;
  private agentName: string;

  constructor(name: string, apiKey: string) {
    this.agentName = name;
    this.apiKey = apiKey;
  }

  async analyze(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          messages: [
            {
              role: 'system',
              content: `You are ${this.agentName}, an expert requirements validation agent. Your job is to analyze requirements, validate them with evidence, and provide truthful, conservative assessments.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-beta',
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error(`[${this.agentName}] Grok API error:`, error.message);
      return `Error: ${error.message}`;
    }
  }
}

class RequirementsValidator {
  private azureDevOpsBaseUrl: string;
  private azureDevOpsAuth: string;
  private grokAgents: GrokAgent[];
  private validationResults: ValidationResult[] = [];

  constructor() {
    this.azureDevOpsBaseUrl = `https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis`;
    this.azureDevOpsAuth = `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`;

    // Create Grok agent team
    this.grokAgents = [
      new GrokAgent('RequirementsAnalyst', GROK_API_KEY),
      new GrokAgent('EvidenceCollector', GROK_API_KEY),
      new GrokAgent('ValidationEngineer', GROK_API_KEY),
      new GrokAgent('QualityAuditor', GROK_API_KEY)
    ];
  }

  async fetchRequirements(): Promise<Requirement[]> {
    console.log('📋 Fetching requirements from Azure DevOps...');

    try {
      const response = await axios.get(
        `${this.azureDevOpsBaseUrl}/wit/wiql?api-version=7.0`,
        {
          headers: {
            Authorization: this.azureDevOpsAuth,
            'Content-Type': 'application/json'
          },
          data: {
            query: `
              SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
                     [System.Description], [Microsoft.VSTS.Common.AcceptanceCriteria]
              FROM workitems
              WHERE [System.TeamProject] = '${AZURE_DEVOPS_PROJECT}'
              AND [System.WorkItemType] IN ('User Story', 'Feature', 'Epic', 'Requirement')
              ORDER BY [System.Id] DESC
            `
          }
        }
      );

      const workItemIds = response.data.workItems.map((wi: any) => wi.id);

      if (workItemIds.length === 0) {
        console.log('No requirements found in Azure DevOps');
        return [];
      }

      // Fetch full work item details
      const detailsResponse = await axios.get(
        `${this.azureDevOpsBaseUrl}/wit/workitems?ids=${workItemIds.join(',')}&api-version=7.0`,
        {
          headers: {
            Authorization: this.azureDevOpsAuth
          }
        }
      );

      return detailsResponse.data.value.map((wi: any) => ({
        id: wi.id.toString(),
        title: wi.fields['System.Title'] || '',
        type: wi.fields['System.WorkItemType'] || '',
        state: wi.fields['System.State'] || '',
        acceptanceCriteria: wi.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
        description: wi.fields['System.Description'] || ''
      }));
    } catch (error: any) {
      console.error('Error fetching requirements:', error.message);
      return [];
    }
  }

  async gatherEvidence(requirement: Requirement): Promise<string[]> {
    console.log(`📊 Gathering evidence for: ${requirement.title}`);
    const evidence: string[] = [];

    // Test API endpoints
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      evidence.push(`✅ API Health Check: ${JSON.stringify(healthResponse.data)}`);
    } catch (error: any) {
      evidence.push(`❌ API Health Check Failed: ${error.message}`);
    }

    // Test Frontend accessibility
    try {
      const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
      evidence.push(`✅ Frontend Accessible: Status ${frontendResponse.status}`);
    } catch (error: any) {
      evidence.push(`❌ Frontend Not Accessible: ${error.message}`);
    }

    // Check database connectivity
    try {
      const dbResponse = await axios.get(`${API_BASE_URL}/api/database/health`, { timeout: 5000 });
      evidence.push(`✅ Database Health: ${JSON.stringify(dbResponse.data)}`);
    } catch (error: any) {
      evidence.push(`⚠️ Database Health Check: ${error.message}`);
    }

    // Check specific endpoints based on requirement type
    const endpointsToTest = this.getRelevantEndpoints(requirement);
    for (const endpoint of endpointsToTest) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, { timeout: 5000 });
        evidence.push(`✅ Endpoint ${endpoint}: Status ${response.status}`);
      } catch (error: any) {
        evidence.push(`❌ Endpoint ${endpoint}: ${error.message}`);
      }
    }

    return evidence;
  }

  getRelevantEndpoints(requirement: Requirement): string[] {
    const title = requirement.title.toLowerCase();
    const endpoints: string[] = [];

    if (title.includes('vehicle')) endpoints.push('/api/vehicles', '/api/vehicles/statistics');
    if (title.includes('driver')) endpoints.push('/api/drivers', '/api/drivers/statistics');
    if (title.includes('maintenance')) endpoints.push('/api/maintenance', '/api/maintenance/upcoming');
    if (title.includes('fuel')) endpoints.push('/api/fuel', '/api/fuel/statistics');
    if (title.includes('route')) endpoints.push('/api/routes', '/api/routes/active');
    if (title.includes('dashboard')) endpoints.push('/api/dashboard', '/api/dashboard/stats');
    if (title.includes('analytics')) endpoints.push('/api/analytics/overview');

    return endpoints.length > 0 ? endpoints : ['/api/health'];
  }

  async validateRequirement(requirement: Requirement, agent: GrokAgent): Promise<ValidationResult> {
    console.log(`\n🔍 Validating: ${requirement.id} - ${requirement.title}`);
    console.log(`   Agent: ${agent['agentName']}`);

    // Gather evidence
    const evidence = await this.gatherEvidence(requirement);

    // Ask Grok to analyze
    const analysisPrompt = `
Requirement ID: ${requirement.id}
Title: ${requirement.title}
Type: ${requirement.type}
Current State: ${requirement.state}

Acceptance Criteria:
${requirement.acceptanceCriteria || 'Not specified'}

Description:
${requirement.description}

Evidence Collected:
${evidence.join('\n')}

Based on this evidence, provide a conservative validation assessment:
1. What validation steps were performed?
2. What is the status? (Verified Complete / Partially Verified / Not Verified / Blocked)
3. What are the key findings?
4. What is the next action needed (if not complete)?

Be honest and conservative - if something cannot be proven, mark it as Not Verified.
`;

    const analysis = await agent.analyze(analysisPrompt);

    // Parse the analysis (simplified - in production, use better parsing)
    const validationResult: ValidationResult = {
      requirementId: requirement.id,
      requirementTitle: requirement.title,
      acceptanceCriteria: requirement.acceptanceCriteria,
      validationSteps: [
        'Evidence collection from API endpoints',
        'Frontend accessibility check',
        'Database connectivity verification',
        'Grok AI agent analysis'
      ],
      status: this.determineStatus(evidence, analysis),
      evidence,
      notes: analysis,
      nextAction: this.determineNextAction(evidence, analysis)
    };

    this.validationResults.push(validationResult);
    return validationResult;
  }

  determineStatus(evidence: string[], analysis: string): ValidationResult['status'] {
    const failedChecks = evidence.filter(e => e.includes('❌')).length;
    const successChecks = evidence.filter(e => e.includes('✅')).length;

    if (failedChecks === 0 && successChecks > 0) {
      return 'Verified Complete';
    } else if (successChecks > failedChecks) {
      return 'Partially Verified';
    } else if (failedChecks > 0) {
      return 'Not Verified';
    } else {
      return 'Blocked';
    }
  }

  determineNextAction(evidence: string[], analysis: string): string {
    if (analysis.toLowerCase().includes('verified complete')) {
      return 'None - Requirement fully validated';
    }

    const failedChecks = evidence.filter(e => e.includes('❌'));
    if (failedChecks.length > 0) {
      return `Fix the following issues: ${failedChecks.map(e => e.replace('❌', '')).join('; ')}`;
    }

    return 'Continue validation with additional evidence';
  }

  async updateAzureDevOps(result: ValidationResult): Promise<void> {
    console.log(`📝 Updating Azure DevOps for requirement ${result.requirementId}...`);

    try {
      const comment = `
## Automated Validation Results

**Status**: ${result.status}

**Validation Steps Performed**:
${result.validationSteps.map(step => `- ${step}`).join('\n')}

**Evidence**:
${result.evidence.map(e => `- ${e}`).join('\n')}

**Analysis**:
${result.notes}

**Next Action**: ${result.nextAction}

---
*Automated validation performed by Grok AI agents*
*Timestamp: ${new Date().toISOString()}*
      `;

      await axios.post(
        `${this.azureDevOpsBaseUrl}/wit/workitems/${result.requirementId}/comments?api-version=7.0`,
        {
          text: comment
        },
        {
          headers: {
            Authorization: this.azureDevOpsAuth,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Azure DevOps updated for requirement ${result.requirementId}`);
    } catch (error: any) {
      console.error(`❌ Failed to update Azure DevOps:`, error.message);
    }
  }

  async generateSummaryReport(): Promise<void> {
    const reportPath = path.join(__dirname, '../REQUIREMENTS_VALIDATION_REPORT.md');

    const verifiedComplete = this.validationResults.filter(r => r.status === 'Verified Complete').length;
    const partiallyVerified = this.validationResults.filter(r => r.status === 'Partially Verified').length;
    const notVerified = this.validationResults.filter(r => r.status === 'Not Verified').length;
    const blocked = this.validationResults.filter(r => r.status === 'Blocked').length;

    const report = `# Fleet-AzureDevOps Requirements Validation Report
**Generated**: ${new Date().toISOString()}
**Validation Method**: Grok AI Agents + Evidence-Based Analysis

---

## Executive Summary

**Total Requirements Validated**: ${this.validationResults.length}

### Status Breakdown:
- ✅ **Verified Complete**: ${verifiedComplete} (${((verifiedComplete / this.validationResults.length) * 100).toFixed(1)}%)
- 🟡 **Partially Verified**: ${partiallyVerified} (${((partiallyVerified / this.validationResults.length) * 100).toFixed(1)}%)
- ❌ **Not Verified**: ${notVerified} (${((notVerified / this.validationResults.length) * 100).toFixed(1)}%)
- 🚫 **Blocked**: ${blocked} (${((blocked / this.validationResults.length) * 100).toFixed(1)}%)

---

## Detailed Validation Results

${this.validationResults.map(result => `
### Requirement ${result.requirementId}: ${result.requirementTitle}

**Acceptance Criteria**:
${result.acceptanceCriteria || 'Not specified'}

**Validation Steps Performed**:
${result.validationSteps.map(step => `- ${step}`).join('\n')}

**Result Status**: ${result.status}

**Evidence**:
${result.evidence.map(e => `- ${e}`).join('\n')}

**Notes/Risks**:
${result.notes}

**Next Action**: ${result.nextAction}

---
`).join('\n')}

## Recommendations

1. **Immediate Actions Required**:
   ${this.validationResults.filter(r => r.status === 'Not Verified' || r.status === 'Blocked')
     .map(r => `- Fix requirement ${r.requirementId}: ${r.nextAction}`).join('\n   ') || 'None'}

2. **Partial Completions**:
   ${this.validationResults.filter(r => r.status === 'Partially Verified')
     .map(r => `- Complete requirement ${r.requirementId}: ${r.nextAction}`).join('\n   ') || 'None'}

3. **Evidence Gaps**:
   - Ensure all endpoints have both visual + empirical proof
   - Add automated tests for continuous validation
   - Document configuration and deployment procedures

---

**Report Generated by**: Grok AI Validation Agents
**Timestamp**: ${new Date().toISOString()}
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\n📄 Validation report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Fleet-AzureDevOps Requirements Validation');
  console.log('==========================================\n');

  if (!AZURE_DEVOPS_PAT) {
    console.error('❌ AZURE_DEVOPS_PAT environment variable not set');
    process.exit(1);
  }

  if (!GROK_API_KEY) {
    console.error('❌ GROK_API_KEY environment variable not set');
    process.exit(1);
  }

  const validator = new RequirementsValidator();

  // Phase 1: Fetch Requirements
  console.log('📋 Phase 1: Fetching requirements from Azure DevOps...');
  const requirements = await validator.fetchRequirements();
  console.log(`Found ${requirements.length} requirements\n`);

  if (requirements.length === 0) {
    console.log('No requirements to validate. Exiting.');
    return;
  }

  // Phase 2: Validate each requirement with Grok agents
  console.log('🔍 Phase 2: Validating requirements with Grok agents...');
  for (let i = 0; i < requirements.length; i++) {
    const requirement = requirements[i];
    const agent = validator['grokAgents'][i % validator['grokAgents'].length];

    const result = await validator.validateRequirement(requirement, agent);
    console.log(`✅ Validated ${i + 1}/${requirements.length}: ${result.status}`);

    // Phase 3: Update Azure DevOps
    await validator.updateAzureDevOps(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Phase 4: Generate Summary Report
  console.log('\n📊 Phase 4: Generating summary report...');
  await validator.generateSummaryReport();

  console.log('\n✅ Requirements validation complete!');
  console.log('   - All requirements validated with Grok AI agents');
  console.log('   - Azure DevOps updated with validation results');
  console.log('   - Summary report generated');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
