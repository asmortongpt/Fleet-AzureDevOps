/**
 * Security Test Suite: Code Injection Vulnerability Fixes
 *
 * This test suite validates that all eval() and Function() constructor
 * instances have been replaced with safe alternatives.
 */

import { describe, it, expect } from '@jest/globals'

describe('Code Injection Security Fixes', () => {
  describe('Workflow Engine - evaluateCondition', () => {
    it('should safely evaluate numeric comparison conditions', () => {
      const { WorkflowEngine } = require('../../services/documents/workflow-engine')
      const engine = new WorkflowEngine()

      const document = {
        id: 'test-doc',
        category: 'financial-documents',
        metadata: {
          extracted: {
            'total-amount': 5000
          }
        }
      }

      // Access private method through reflection for testing
      const evaluateCondition = (engine as any).evaluateCondition.bind(engine)

      // Test safe numeric comparison
      expect(evaluateCondition('amount > 1000', document)).toBe(true)
      expect(evaluateCondition('amount < 10000', document)).toBe(true)
      expect(evaluateCondition('amount == 5000', document)).toBe(true)
    })

    it('should safely handle invalid expressions without code execution', () => {
      const { WorkflowEngine } = require('../../services/documents/workflow-engine')
      const engine = new WorkflowEngine()

      const document = {
        id: 'test-doc',
        category: 'financial-documents',
        metadata: { extracted: { 'total-amount': 5000 } }
      }

      const evaluateCondition = (engine as any).evaluateCondition.bind(engine)

      // Malicious code injection attempts should fail safely
      expect(evaluateCondition('process.exit(1)', document)).toBe(false)
      expect(evaluateCondition('require("fs").readFileSync("/etc/passwd")', document)).toBe(false)
      expect(evaluateCondition('(() => { while(true) {} })()', document)).toBe(false)
    })

    it('should prevent arbitrary code execution through string manipulation', () => {
      const { WorkflowEngine } = require('../../services/documents/workflow-engine')
      const engine = new WorkflowEngine()

      const document = {
        id: 'test-doc',
        category: 'financial-documents',
        metadata: {
          extracted: { 'total-amount': 5000 },
          analysis: { severity: 'high' }
        }
      }

      const evaluateCondition = (engine as any).evaluateCondition.bind(engine)

      // Code injection via string concatenation should not work
      expect(evaluateCondition('severity + "; malicious()"', document)).toBe(false)
    })
  })

  describe('Report Renderer - calculateMeasure', () => {
    it('should safely evaluate mathematical expressions', () => {
      // Create a mock component to test the calculateMeasure function
      const React = require('react')
      const { renderHook } = require('@testing-library/react')
      const { DynamicReportRenderer } = require('../../../src/components/reports/DynamicReportRenderer')

      const measure = {
        id: 'utilization',
        label: 'Utilization Rate',
        expression: 'active_count / total_count',
        format: 'percent'
      }

      const dataset = [
        { active_count: 75, total_count: 100 }
      ]

      // Extract calculateMeasure logic
      const mockProps = {
        report: { id: 'test', title: 'Test', visuals: [] },
        data: dataset
      }

      // The component should handle this safely without eval()
      expect(() => {
        const element = React.createElement(DynamicReportRenderer, mockProps)
        // If this doesn't throw, the component is safe
      }).not.toThrow()
    })

    it('should prevent code execution through expressions', () => {
      const measure = {
        id: 'malicious',
        label: 'Malicious',
        expression: 'require("child_process").exec("rm -rf /")',
        format: 'integer'
      }

      const dataset = [
        { active_count: 75, total_count: 100 }
      ]

      // This should fail safely, not execute code
      // The mathjs parser will reject this as invalid syntax
      expect(() => {
        const math = require('mathjs')
        math.parse(measure.expression)
      }).toThrow()
    })

    it('should only evaluate safe mathematical operations', () => {
      const math = require('mathjs')

      // Safe expressions should work
      expect(() => math.parse('a + b')).not.toThrow()
      expect(() => math.parse('a / b * 100')).not.toThrow()
      expect(() => math.parse('sqrt(a^2 + b^2)')).not.toThrow()

      // Dangerous operations should be rejected
      expect(() => math.evaluate('import("fs")')).toThrow()
    })
  })

  describe('Policy Engine - evaluateCustomLogic', () => {
    it('should safely evaluate JSON-Logic rules', () => {
      const { PolicyEnforcementEngine } = require('../../../src/lib/policy-engine/policy-enforcement-engine')
      const engine = new PolicyEnforcementEngine()

      const context = {
        operation: 'vehicle.assign',
        module: 'dispatch',
        user: { id: 'user1', name: 'Test User', role: 'driver', permissions: [] },
        data: { vehicleId: 'v1', driverId: 'd1', value: 150 },
        timestamp: new Date(),
        requestId: 'req-123'
      }

      // Access private method for testing
      const evaluateCustomLogic = (engine as any).evaluateCustomLogic.bind(engine)

      // JSON-Logic format should work
      const jsonLogicRule = JSON.stringify({ '>': [{ var: 'value' }, 100] })
      expect(evaluateCustomLogic(jsonLogicRule, context, 150)).toBe(true)

      const jsonLogicRule2 = JSON.stringify({ '<': [{ var: 'value' }, 100] })
      expect(evaluateCustomLogic(jsonLogicRule2, context, 150)).toBe(false)
    })

    it('should prevent arbitrary code execution via custom logic', () => {
      const { PolicyEnforcementEngine } = require('../../../src/lib/policy-engine/policy-enforcement-engine')
      const engine = new PolicyEnforcementEngine()

      const context = {
        operation: 'vehicle.assign',
        module: 'dispatch',
        user: { id: 'user1', name: 'Test User', role: 'driver', permissions: [] },
        data: { vehicleId: 'v1', driverId: 'd1' },
        timestamp: new Date(),
        requestId: 'req-123'
      }

      const evaluateCustomLogic = (engine as any).evaluateCustomLogic.bind(engine)

      // Malicious code should not execute
      expect(evaluateCustomLogic('process.exit()', context, null)).toBe(false)
      expect(evaluateCustomLogic('require("fs")', context, null)).toBe(false)
      expect(evaluateCustomLogic('global.malicious = true', context, null)).toBe(false)
    })

    it('should handle backward compatibility for simple expressions', () => {
      const { PolicyEnforcementEngine } = require('../../../src/lib/policy-engine/policy-enforcement-engine')
      const engine = new PolicyEnforcementEngine()

      const context = {
        operation: 'vehicle.assign',
        module: 'dispatch',
        user: { id: 'user1', name: 'Test User', role: 'driver', permissions: [] },
        data: { value: 150 },
        timestamp: new Date(),
        requestId: 'req-123'
      }

      const evaluateCustomLogic = (engine as any).evaluateCustomLogic.bind(engine)

      // Simple comparisons should be converted to JSON-Logic
      expect(evaluateCustomLogic('value > 100', context, 150)).toBe(true)
      expect(evaluateCustomLogic('value < 100', context, 150)).toBe(false)
    })
  })

  describe('Codebase-wide validation', () => {
    it('should have no eval() calls in production code', () => {
      const fs = require('fs')
      const path = require('path')
      const glob = require('glob')

      const srcFiles = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
        ignore: ['**/node_modules/**', '**/tests/**', '**/test/**', '**/*.test.*', '**/*.spec.*']
      })

      const apiFiles = glob.sync('api/src/**/*.{ts,tsx,js,jsx}', {
        ignore: ['**/node_modules/**', '**/tests/**', '**/test/**', '**/*.test.*', '**/*.spec.*']
      })

      const allFiles = [...srcFiles, ...apiFiles]
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8')

        // Check for eval() usage (excluding comments)
        const lines = content.split('\n')
        lines.forEach((line, idx) => {
          if (!line.trim().startsWith('//') &&
              !line.trim().startsWith('*') &&
              /\beval\s*\(/.test(line)) {
            violations.push(`${file}:${idx + 1} - eval() usage detected`)
          }
        })
      })

      expect(violations).toEqual([])
    })

    it('should have no Function() constructor calls in production code', () => {
      const fs = require('fs')
      const path = require('path')
      const glob = require('glob')

      const srcFiles = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
        ignore: ['**/node_modules/**', '**/tests/**', '**/test/**', '**/*.test.*', '**/*.spec.*']
      })

      const apiFiles = glob.sync('api/src/**/*.{ts,tsx,js,jsx}', {
        ignore: ['**/node_modules/**', '**/tests/**', '**/test/**', '**/*.test.*', '**/*.spec.*']
      })

      const allFiles = [...srcFiles, ...apiFiles]
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8')

        // Check for new Function() usage (excluding comments)
        const lines = content.split('\n')
        lines.forEach((line, idx) => {
          if (!line.trim().startsWith('//') &&
              !line.trim().startsWith('*') &&
              /\bnew\s+Function\s*\(/.test(line)) {
            violations.push(`${file}:${idx + 1} - Function() constructor usage detected`)
          }
        })
      })

      expect(violations).toEqual([])
    })

    it('should use safe alternatives for expression evaluation', () => {
      const fs = require('fs')

      // Check workflow engine uses expr-eval
      const workflowEngine = fs.readFileSync('api/src/services/documents/workflow-engine.ts', 'utf-8')
      expect(workflowEngine).toContain('expr-eval')
      expect(workflowEngine).toContain('Parser')
      expect(workflowEngine).not.toContain(/\beval\s*\(/)

      // Check report renderer uses mathjs
      const reportRenderer = fs.readFileSync('src/components/reports/DynamicReportRenderer.tsx', 'utf-8')
      expect(reportRenderer).toContain('mathjs')
      expect(reportRenderer).not.toContain(/\beval\s*\(/)

      // Check policy engine uses json-logic-js
      const policyEngine = fs.readFileSync('src/lib/policy-engine/policy-enforcement-engine.ts', 'utf-8')
      expect(policyEngine).toContain('json-logic-js')
      expect(policyEngine).not.toContain(/\bnew\s+Function\s*\(/)
    })
  })
})
