/**
 * Script to automatically fix common ESLint issues
 */
import * as path from 'path';

import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

// Get all source files
const sourceFiles = project.getSourceFiles('src/**/*.ts');

let fixCount = 0;

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();

  // Skip test files and node_modules
  if (filePath.includes('__tests__') || filePath.includes('node_modules') || filePath.endsWith('.d.ts')) {
    continue;
  }

  console.log(`Processing: ${filePath}`);

  // Fix 1: Add curly braces to if statements
  sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement).forEach(ifStatement => {
    const thenStatement = ifStatement.getThenStatement();
    const elseStatement = ifStatement.getElseStatement();

    if (thenStatement && thenStatement.getKind() !== SyntaxKind.Block) {
      const text = thenStatement.getText();
      thenStatement.replaceWithText(`{\n  ${text}\n}`);
      fixCount++;
    }

    if (elseStatement && elseStatement.getKind() !== SyntaxKind.Block && elseStatement.getKind() !== SyntaxKind.IfStatement) {
      const text = elseStatement.getText();
      elseStatement.replaceWithText(`{\n  ${text}\n}`);
      fixCount++;
    }
  });

  // Fix 2: Prefix unused parameters with underscore
  sourceFile.getFunctions().forEach(func => {
    func.getParameters().forEach(param => {
      const name = param.getName();
      const references = param.findReferences();
      const usageCount = references.reduce((sum, ref) => sum + ref.getReferences().length, 0);

      if (usageCount <= 1 && !name.startsWith('_')) {
        param.rename(`_${name}`);
        fixCount++;
      }
    });
  });

  // Fix 3: Prefix unused variables with underscore
  sourceFile.getVariableDeclarations().forEach(varDecl => {
    const name = varDecl.getName();
    const references = varDecl.findReferences();
    const usageCount = references.reduce((sum, ref) => sum + ref.getReferences().length, 0);

    if (usageCount <= 1 && !name.startsWith('_')) {
      varDecl.rename(`_${name}`);
      fixCount++;
    }
  });

  // Save the file
  sourceFile.saveSync();
}

console.log(`\nFixed ${fixCount} issues across ${sourceFiles.length} files`);
