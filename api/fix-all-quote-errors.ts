#!/usr/bin/env tsx

/**
 * Comprehensive Quote Syntax Fixer using ts-morph AST parsing
 * Fixes all remaining TypeScript template literal syntax errors
 */

import * as fs from 'fs';
import * as path from 'path';

import { Project, SyntaxKind } from 'ts-morph';

interface FixResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class QuoteSyntaxFixer {
  private project: Project;
  private results: FixResult[] = [];
  private totalFixes = 0;

  constructor(private srcDir: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(path.dirname(srcDir), 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true,
    });
  }

  /**
   * Main fix method - processes all TypeScript files
   */
  async fixAllFiles(): Promise<void> {
    const files = this.getAllTsFiles(this.srcDir);
    console.log(`Found ${files.length} TypeScript files to scan\n`);

    for (const filePath of files) {
      try {
        await this.fixFile(filePath);
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        this.results.push({
          file: filePath,
          fixes: [],
          errors: [`Failed to process: ${error}`],
        });
      }
    }

    this.printSummary();
  }

  /**
   * Fix a single file
   */
  private async fixFile(filePath: string): Promise<void> {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const fixes: string[] = [];

    try {
      // Fix SQL template literals (backtick strings with wrong inner quotes)
      this.fixSqlTemplateLiterals(sourceFile, fixes);

      // Fix type union literals with mixed quotes
      this.fixTypeUnionLiterals(sourceFile, fixes);

      // Fix ternary expressions with mixed quotes
      this.fixTernaryExpressions(sourceFile, fixes);

      // Fix object property string literals with wrong quotes
      this.fixObjectPropertyLiterals(sourceFile, fixes);

      // Save changes if any fixes were made
      if (fixes.length > 0) {
        await sourceFile.save();
        this.totalFixes += fixes.length;
        this.results.push({
          file: path.relative(this.srcDir, filePath),
          fixes,
          errors: [],
        });
        console.log(`✓ Fixed ${fixes.length} issues in ${path.basename(filePath)}`);
      }
    } catch (error) {
      this.results.push({
        file: path.relative(this.srcDir, filePath),
        fixes,
        errors: [`Error fixing: ${error}`],
      });
    } finally {
      this.project.removeSourceFile(sourceFile);
    }
  }

  /**
   * Fix SQL template literals - replace backticks with single quotes inside
   */
  private fixSqlTemplateLiterals(sourceFile: any, fixes: string[]): void {
    const templateLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.TemplateExpression);
    const noSubTemplateLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral);

    [...templateLiterals, ...noSubTemplateLiterals].forEach((template: any) => {
      const fullText = template.getText();

      // Check if this looks like a SQL query (contains SELECT, INSERT, UPDATE, DELETE, etc.)
      const isSqlQuery = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|ALTER|DROP)\b/i.test(fullText);

      if (isSqlQuery) {
        let fixed = false;

        // Get template spans (the parts between ${...})
        if (template.getKind() === SyntaxKind.TemplateExpression) {
          const templateSpans = template.getTemplateSpans();
          const head = template.getHead();

          // Fix head
          const headText = head.getText();
          const headContent = headText.slice(1); // Remove leading backtick
          const fixedHead = this.fixSqlString(headContent);
          if (fixedHead !== headContent) {
            head.replaceWithText('`' + fixedHead);
            fixed = true;
          }

          // Fix middle and tail spans
          templateSpans.forEach((span: any) => {
            const literal = span.getLiteral();
            const literalText = literal.getText();

            // Extract content between } and ` (middle) or between } and final ` (tail)
            const isMiddle = literal.getKind() === SyntaxKind.TemplateMiddle;
            const isTail = literal.getKind() === SyntaxKind.TemplateTail;

            if (isMiddle || isTail) {
              const content = literalText.slice(1, -1); // Remove surrounding markers
              const fixedContent = this.fixSqlString(content);

              if (fixedContent !== content) {
                if (isMiddle) {
                  literal.replaceWithText('}' + fixedContent + '${');
                } else {
                  literal.replaceWithText('}' + fixedContent + '`');
                }
                fixed = true;
              }
            }
          });
        } else {
          // NoSubstitutionTemplateLiteral
          const content = fullText.slice(1, -1); // Remove backticks
          const fixedContent = this.fixSqlString(content);

          if (fixedContent !== content) {
            template.replaceWithText('`' + fixedContent + '`');
            fixed = true;
          }
        }

        if (fixed) {
          fixes.push(`Fixed SQL template literal: ${fullText.substring(0, 60)}...`);
        }
      }
    });
  }

  /**
   * Fix string content inside SQL - replace backticks with single quotes
   */
  private fixSqlString(content: string): string {
    let fixed = content;

    // Pattern 1: Standalone backtick-quoted strings like `'value'` → 'value'
    fixed = fixed.replace(/`'([^'`]+)'`/g, "'$1'");

    // Pattern 2: Backtick before single quote like `'value' → 'value'
    fixed = fixed.replace(/`'([^'`]+)'/g, "'$1'");

    // Pattern 3: Single quote before backtick like 'value'` → 'value'
    fixed = fixed.replace(/'([^'`]+)'`/g, "'$1'");

    // Pattern 4: Backticks used as string delimiters in SQL (not variable placeholders)
    // Look for patterns like `, `value`, ` followed by SQL keywords
    fixed = fixed.replace(/,\s*`([^`$]+)`\s*(,|FROM|WHERE|AND|OR|JOIN|$)/gi, (match, value, after) => {
      // Make sure it's not a template expression placeholder
      if (!value.includes('${')) {
        return `, '${value}' ${after}`;
      }
      return match;
    });

    // Pattern 5: Backticks at start of values like `value → 'value
    fixed = fixed.replace(/VALUES\s*\(\s*`([^`$]+)/gi, (match, value) => {
      if (!value.includes('${')) {
        return `VALUES ('${value}`;
      }
      return match;
    });

    return fixed;
  }

  /**
   * Fix type union literals with mixed quotes
   */
  private fixTypeUnionLiterals(sourceFile: any, fixes: string[]): void {
    const typeNodes = sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference);
    const unionTypes = sourceFile.getDescendantsOfKind(SyntaxKind.UnionType);

    [...typeNodes, ...unionTypes].forEach((node: any) => {
      const text = node.getText();

      // Check for mixed quotes in union types like 'create' | `update`
      const hasMixedQuotes = /(['`])\w+\1\s*\|\s*([`'])\w+\2/.test(text);

      if (hasMixedQuotes) {
        // Normalize all to single quotes
        const fixed = text.replace(/`(\w+)`/g, "'$1'");

        if (fixed !== text) {
          node.replaceWithText(fixed);
          fixes.push(`Fixed type union: ${text} → ${fixed}`);
        }
      }
    });
  }

  /**
   * Fix ternary expressions with mixed quotes
   */
  private fixTernaryExpressions(sourceFile: any, fixes: string[]): void {
    const conditionals = sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression);

    conditionals.forEach((conditional: any) => {
      const text = conditional.getText();

      // Check for mixed quotes in ternary like `val` ? 'a' : `b`
      const hasMixedQuotes = /[`']/.test(text) && text.includes('`') && text.includes("'");

      if (hasMixedQuotes) {
        let fixed = text;

        // Fix string literals in ternary (prefer single quotes for simple strings)
        fixed = fixed.replace(/`([^`$\n]+)`/g, (match, content) => {
          // Keep as template literal if it contains ${...}
          if (content.includes('${')) {
            return match;
          }
          return `'${content}'`;
        });

        if (fixed !== text) {
          conditional.replaceWithText(fixed);
          fixes.push(`Fixed ternary expression: ${text.substring(0, 40)}...`);
        }
      }
    });
  }

  /**
   * Fix object property string literals
   */
  private fixObjectPropertyLiterals(sourceFile: any, fixes: string[]): void {
    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);

    stringLiterals.forEach((literal: any) => {
      const text = literal.getText();

      // If it's a backtick-quoted string that doesn't need to be a template literal
      if (text.startsWith('`') && text.endsWith('`')) {
        const content = text.slice(1, -1);

        // Keep as template literal if it contains ${...} or has specific SQL patterns
        if (!content.includes('${') && !content.match(/\b(SELECT|INSERT|UPDATE|DELETE)\b/i)) {
          const parent = literal.getParent();

          // Don't change if parent is already a template expression
          if (parent?.getKind() !== SyntaxKind.TemplateExpression) {
            literal.replaceWithText(`'${content}'`);
            fixes.push(`Fixed object property: \`${content}\` → '${content}'`);
          }
        }
      }
    });
  }

  /**
   * Get all TypeScript files recursively
   */
  private getAllTsFiles(dir: string): string[] {
    const files: string[] = [];

    const scan = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Print summary report
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('QUOTE SYNTAX FIX SUMMARY');
    console.log('='.repeat(80));

    const filesWithFixes = this.results.filter(r => r.fixes.length > 0);
    const filesWithErrors = this.results.filter(r => r.errors.length > 0);

    console.log(`\nTotal files scanned: ${this.results.length}`);
    console.log(`Files with fixes: ${filesWithFixes.length}`);
    console.log(`Total fixes applied: ${this.totalFixes}`);
    console.log(`Files with errors: ${filesWithErrors.length}`);

    if (filesWithFixes.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('FILES FIXED:');
      console.log('-'.repeat(80));

      filesWithFixes.forEach(result => {
        console.log(`\n${result.file} (${result.fixes.length} fixes):`);
        result.fixes.forEach(fix => console.log(`  - ${fix}`));
      });
    }

    if (filesWithErrors.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('ERRORS:');
      console.log('-'.repeat(80));

      filesWithErrors.forEach(result => {
        console.log(`\n${result.file}:`);
        result.errors.forEach(error => console.log(`  ! ${error}`));
      });
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const srcDir = process.argv[2] || '/Users/andrewmorton/Documents/GitHub/Fleet/api/src';

  console.log('TypeScript Quote Syntax Fixer');
  console.log('='.repeat(80));
  console.log(`Source directory: ${srcDir}\n`);

  if (!fs.existsSync(srcDir)) {
    console.error(`Error: Directory not found: ${srcDir}`);
    process.exit(1);
  }

  const fixer = new QuoteSyntaxFixer(srcDir);
  await fixer.fixAllFiles();

  console.log('\nFix completed! Now testing API startup...\n');
}

main().catch(console.error);
