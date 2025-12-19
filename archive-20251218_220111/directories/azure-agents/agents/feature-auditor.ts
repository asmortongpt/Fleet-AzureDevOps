#!/usr/bin/env tsx
/**
 * Feature Auditor Agent
 * Spiders through EVERY feature in the codebase
 * Analyzes completeness, functionality, and industry standards
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_DIR = '/home/azureuser/fleet-local';

interface FeatureAudit {
  feature: string;
  location: string;
  completeness: number; // 0-100%
  isWorking: boolean;
  industryStandard: 'Leading' | 'Competitive' | 'Basic' | 'Incomplete';
  missingElements: string[];
  recommendations: string[];
}

async function analyzeWithAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert software auditor. Analyze code quality, completeness, and industry standards.
          Compare against best-in-class solutions like Samsara, Geotab, Verizon Connect.
          Return structured JSON analysis.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function findAllFeatures(): Promise<string[]> {
  const features: string[] = [];

  // Find all route files
  const { stdout: routes } = await execAsync(`find ${API_DIR}/api/src/routes -name "*.ts" -o -name "*.js"`);
  features.push(...routes.trim().split('\n').filter(Boolean));

  // Find all component files
  const { stdout: components } = await execAsync(`find ${API_DIR}/src/components -name "*.tsx" -o -name "*.jsx"`);
  features.push(...components.trim().split('\n').filter(Boolean));

  // Find all page files
  const { stdout: pages } = await execAsync(`find ${API_DIR}/src/pages -name "*.tsx" -o -name "*.jsx"`);
  features.push(...pages.trim().split('\n').filter(Boolean));

  return features;
}

async function auditFeature(filePath: string): Promise<FeatureAudit> {
  const content = await fs.readFile(filePath, 'utf-8');
  const featureName = path.basename(filePath, path.extname(filePath));

  console.log(`\n🔍 Auditing: ${featureName}`);

  const analysisPrompt = `
Analyze this ${featureName} feature:

\`\`\`
${content.slice(0, 3000)}
\`\`\`

Return JSON with this structure:
{
  "completeness": 0-100,
  "isWorking": true/false,
  "industryStandard": "Leading|Competitive|Basic|Incomplete",
  "missingElements": ["element1", "element2"],
  "recommendations": ["rec1", "rec2"]
}

Compare against industry leaders: Samsara, Geotab, Verizon Connect.
Check for:
- Error handling
- TypeScript types
- Security (SQL injection, XSS)
- Performance optimizations
- Real-time capabilities
- Mobile responsiveness
- Accessibility
- Industry best practices
`;

  const analysis = await analyzeWithAI(analysisPrompt);
  const parsed = JSON.parse(analysis.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

  return {
    feature: featureName,
    location: filePath,
    ...parsed
  };
}

async function main() {
  console.log('========================================');
  console.log('Feature Auditor Agent - Starting');
  console.log('========================================\n');

  const features = await findAllFeatures();
  console.log(`\n📊 Found ${features.length} features to audit\n`);

  const audits: FeatureAudit[] = [];

  for (const feature of features.slice(0, 50)) { // Limit to 50 for performance
    try {
      const audit = await auditFeature(feature);
      audits.push(audit);

      console.log(`  ✓ ${audit.feature}`);
      console.log(`    Completeness: ${audit.completeness}%`);
      console.log(`    Industry Standard: ${audit.industryStandard}`);
      console.log(`    Working: ${audit.isWorking ? '✅' : '❌'}`);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error auditing ${feature}:`, error);
    }
  }

  // Write comprehensive audit report
  const report = {
    timestamp: new Date().toISOString(),
    totalFeatures: audits.length,
    summary: {
      averageCompleteness: audits.reduce((sum, a) => sum + a.completeness, 0) / audits.length,
      workingFeatures: audits.filter(a => a.isWorking).length,
      industryLeading: audits.filter(a => a.industryStandard === 'Leading').length,
      needsWork: audits.filter(a => a.completeness < 70).length
    },
    audits
  };

  await fs.writeFile(
    '/tmp/feature-audit-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n========================================');
  console.log('Feature Audit Complete!');
  console.log('========================================');
  console.log(`\n📈 Summary:`);
  console.log(`  Total Features: ${report.totalFeatures}`);
  console.log(`  Average Completeness: ${report.summary.averageCompleteness.toFixed(1)}%`);
  console.log(`  Working: ${report.summary.workingFeatures}/${report.totalFeatures}`);
  console.log(`  Industry Leading: ${report.summary.industryLeading}`);
  console.log(`  Needs Work: ${report.summary.needsWork}`);
  console.log(`\n📄 Full report: /tmp/feature-audit-report.json\n`);
}

main().catch(console.error);
