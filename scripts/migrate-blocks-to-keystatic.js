import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '../src/content/pages');

function migrateFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContent);

  if (!parsed.data.blocks) return;

  let changed = false;
  const newBlocks = parsed.data.blocks.map(block => {
    if (block._template) {
      changed = true;
      const discriminant = block._template;
      const { _template, ...value } = block;
      return { discriminant, value };
    }
    return block;
  });

  if (changed) {
    parsed.data.blocks = newBlocks;
    const newContent = matter.stringify(parsed.content || '', parsed.data);
    fs.writeFileSync(filePath, newContent);
    console.log(`Migrated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.md')) {
      migrateFile(fullPath);
    }
  }
}

processDirectory(pagesDir);
console.log('Migration complete.');
