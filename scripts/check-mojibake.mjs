import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const targetDirs = ['app', 'src'];
const filePattern = /\.(ts|tsx)$/;
const mojibakePattern = /Ã|Â|â|ï¿½|�/;

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
      if (!mojibakePattern.test(line)) {
        return;
      }

      findings.push({
        filePath,
        lineNumber: index + 1,
        line: line.trim(),
      });
    });
  }
}

if (findings.length > 0) {
  console.error('Mojibake detected in source files:\n');

  for (const finding of findings) {
    const relativePath = path.relative(rootDir, finding.filePath);
    console.error(`${relativePath}:${finding.lineNumber}: ${finding.line}`);
  }

  process.exit(1);
}

console.log('No mojibake found in app/ and src/.');
