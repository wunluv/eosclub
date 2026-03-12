/**
 * Migration Script: HTML → Markdoc/Markdown
 *
 * Converts ContentBlock.body and FaqBlock.answer fields from HTML to Markdown.
 *
 * Rules:
 * - <p>text</p> → text (blank-line-separated paragraph)
 * - <h2>title</h2> → ## title
 * - <h3>title</h3> → ### title
 * - <a href="url">text</a> → [text](url)
 * - <strong>text</strong> → **text**
 * - <em>text</em> → *text*
 * - <ul><li>x</li></ul> → - x
 * - <ol><li>x</li></ol> → 1. x
 * - <br /> → double newline
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR_DE = 'src/content/pages/de';
const CONTENT_DIR_EN = 'src/content/pages/en';

function convertHtmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return html;

  let md = html;

  // Handle <br /> tags first - convert to double newline
  md = md.replace(/<br\s*\/?>/gi, '\n\n');

  // Handle paragraphs - extract content and add blank lines
  // First handle simple <p>text</p> patterns
  md = md.replace(/<p>([^<]*?)<\/p>/gi, '$1');

  // Handle <p> with nested content
  md = md.replace(/<p>([\s\S]*?)<\/p>/gi, (match, content) => {
    // Remove any remaining block tags within p and add spacing
    return content + '\n\n';
  });

  // Handle headings
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

  // Handle links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Handle bold
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');

  // Handle italic
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');

  // Handle unordered lists - more complex due to nested structure
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return '\n' + items.map(item => {
      return '- ' + item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1');
    }).join('\n') + '\n';
  });

  // Handle ordered lists
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return '\n' + items.map((item, index) => {
      return (index + 1) + '. ' + item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1');
    }).join('\n') + '\n';
  });

  // Clean up remaining tags
  md = md.replace(/<\/?[^>]+>/g, '');

  // Clean up multiple blank lines
  md = md.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  md = md.trim();

  return md;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;

  // Pattern to match ContentBlock body fields.
  // Captures the "body:" key (group 1) + any existing scalar indicator + newline,
  // and the body content lines (group 2).
  // Handles: body: >-\n, body: |-\n, body: >\n, body: |\n, body:\n (bare)
  const bodyPattern = /([ \t]*body:\s*(?:>-?|\|-?)?\s*\n)([\s\S]*?)(?=\n\s*fullBleed:|\n\s*backgroundImage:|\n\s*[a-zA-Z-]+:|\n---)/g;

  // Pattern to match single-line inline body: <html content>
  const inlineBodyPattern = /^(\s*body:\s*)(<.+>)$/gm;

  // Process single-line inline body values first
  newContent = newContent.replace(inlineBodyPattern, (match, prefix, htmlContent) => {
    modified = true;
    return `${prefix}>-\n  ${htmlContent}`;
  });

  // Pattern to match FaqBlock answer fields
  const answerPattern = /([ \t]*answer:\s*(?:>-?|\|-?)?\s*\n)([\s\S]*?)(?=\n\s*question:|\n\s*- question:)/g;

  /**
   * Strip any stale block scalar indicator line that may appear as the first
   * line of captured body/answer content (e.g. a bare "|-" or ">-" line left
   * over from a previous migration pass).
   */
  function stripLeadingScalarIndicator(text) {
    return text.replace(/^[ \t]*(>-?|\|-?)[ \t]*\n/, '');
  }

  /**
   * Build a valid YAML block scalar replacement for a given key prefix and markdown body.
   * - Extracts the leading whitespace of the key line to determine indent level.
   * - Content lines are indented at key_indent + 2 spaces (YAML requirement).
   * - Strips any existing scalar indicator from the prefix before rewriting with >-.
   */
  function buildBlockScalar(prefix, markdown) {
    // Extract leading spaces of the key line (e.g. "      body:" → "      ")
    const keyIndentMatch = prefix.match(/^([ \t]*)/);
    const keyIndent = keyIndentMatch ? keyIndentMatch[1] : '';
    const contentIndent = keyIndent + '  ';

    // Strip the scalar indicator (>-, |-, >, |) from the prefix to get bare "key:"
    const bareKey = prefix.replace(/(\s*(?:>-?|\|-?)\s*)?\n$/, '').trimEnd();

    // Re-indent each content line; preserve blank lines as empty strings
    const indented = markdown
      .split('\n')
      .map(l => (l.trim() === '' ? '' : contentIndent + l.trim()))
      .join('\n');

    return `${bareKey} >-\n${indented}\n`;
  }

  // Process ContentBlock.body
  newContent = newContent.replace(bodyPattern, (match, prefix, bodyContent) => {
    const cleaned = stripLeadingScalarIndicator(bodyContent);
    const markdown = convertHtmlToMarkdown(cleaned);
    if (markdown !== cleaned) {
      modified = true;
      return buildBlockScalar(prefix, markdown);
    }
    return match;
  });

  // Process FaqBlock.answer
  newContent = newContent.replace(answerPattern, (match, prefix, answerContent) => {
    const cleaned = stripLeadingScalarIndicator(answerContent);
    const markdown = convertHtmlToMarkdown(cleaned);
    if (markdown !== cleaned) {
      modified = true;
      return buildBlockScalar(prefix, markdown);
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let changedFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      changedFiles = changedFiles.concat(processDirectory(filePath));
    } else if (file.endsWith('.md')) {
      const changed = processFile(filePath);
      if (changed) {
        changedFiles.push(filePath);
      }
    }
  }

  return changedFiles;
}

console.log('Starting HTML → Markdoc migration...\n');

const deFiles = processDirectory(CONTENT_DIR_DE);
const enFiles = processDirectory(CONTENT_DIR_EN);

console.log('=== Migration Complete ===\n');

if (deFiles.length > 0) {
  console.log('German files modified:');
  deFiles.forEach(f => console.log(`  - ${f}`));
} else {
  console.log('No German files modified.');
}

console.log('');

if (enFiles.length > 0) {
  console.log('English files modified:');
  enFiles.forEach(f => console.log(`  - ${f}`));
} else {
  console.log('No English files modified.');
}

console.log(`\nTotal: ${deFiles.length + enFiles.length} files modified.`);
