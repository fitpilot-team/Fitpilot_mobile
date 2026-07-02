import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const targetDirs = ['app', 'src'];
const filePattern = /\.(ts|tsx)$/;
const mojibakePattern = /Ã|Â|�/;
const knownMisspellings = [
  { pattern: /\bTodavia\b/i, suggestion: 'Todavía' },
  { pattern: /\btodavia\b/i, suggestion: 'todavía' },
  { pattern: /\bcomposicion\b/i, suggestion: 'composición' },
  { pattern: /\bperimetros\b/i, suggestion: 'perímetros' },
  { pattern: /\bdemas\b/i, suggestion: 'demás' },
  { pattern: /\bLimite\b/i, suggestion: 'Límite' },
  { pattern: /\blimite\b/i, suggestion: 'límite' },
  { pattern: /\bEliminacion\b/i, suggestion: 'Eliminación' },
  { pattern: /\baccion\b/i, suggestion: 'acción' },
  { pattern: /\bse actualizo\b/i, suggestion: 'se actualizó' },
  { pattern: /\bguardo\b/i, suggestion: 'guardó' },
  { pattern: /\bclinico\b/i, suggestion: 'clínico' },
  { pattern: /\bSintomas\b/i, suggestion: 'Síntomas' },
  { pattern: /\bdespues\b/i, suggestion: 'después' },
  { pattern: /\bnutriologo\b/i, suggestion: 'nutriólogo' },
  { pattern: /\bTerminos\b/i, suggestion: 'Términos' },
  { pattern: /\bPolitica\b/i, suggestion: 'Política' },
  { pattern: /\banalisis\b/i, suggestion: 'análisis' },
  { pattern: /\bhistorico\b/i, suggestion: 'histórico' },
  { pattern: /\binvalida\b/i, suggestion: 'inválida' },
  { pattern: /\binvalido\b/i, suggestion: 'inválido' },
];

const likelyUserFacingLinePattern = /['"`>]/;

const listSourceFiles = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && filePattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

const findings = [];

for (const targetDir of targetDirs) {
  const absoluteDir = path.join(rootDir, targetDir);

  if (!fs.existsSync(absoluteDir)) {
    continue;
  }

  for (const filePath of listSourceFiles(absoluteDir)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (mojibakePattern.test(line)) {
        findings.push({
          filePath,
          lineNumber: index + 1,
          line: line.trim(),
          reason: 'mojibake',
        });
      }

      if (!likelyUserFacingLinePattern.test(line)) {
        return;
      }

      knownMisspellings.forEach((misspelling) => {
        if (!misspelling.pattern.test(line)) {
          return;
        }

        findings.push({
          filePath,
          lineNumber: index + 1,
          line: line.trim(),
          reason: `known misspelling, use "${misspelling.suggestion}"`,
        });
      });
    });
  }
}

if (findings.length > 0) {
  console.error('Mojibake detected in source files:\n');

  for (const finding of findings) {
    const relativePath = path.relative(rootDir, finding.filePath);
    console.error(`${relativePath}:${finding.lineNumber}: ${finding.reason}: ${finding.line}`);
  }

  process.exit(1);
}

console.log('No mojibake found in app/ and src/.');
