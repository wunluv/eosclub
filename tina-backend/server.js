import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLocalDatabase } from '@tinacms/datalayer';
import { resolve } from '@tinacms/graphql';
import { login, authenticate } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { exec } from 'child_process';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// Resolve paths: check volume-mounted repo first, then Docker-copied fallback
// ---------------------------------------------------------------------------
const repoTinaDir = path.resolve('/app/repo/tina');
const fallbackTinaDir = path.resolve(__dirname, '../tina');

let tinaDir;
if (existsSync(path.join(repoTinaDir, '__generated__', '_schema.json'))) {
  tinaDir = repoTinaDir;
  console.log(`Using volume-mounted tina dir: ${tinaDir}`);
} else if (existsSync(path.join(fallbackTinaDir, '__generated__', '_schema.json'))) {
  tinaDir = fallbackTinaDir;
  console.log(`Using Docker-copied tina dir: ${tinaDir}`);
} else {
  console.error('FATAL: Cannot find tina/__generated__/_schema.json in any known location');
  console.error(`  Checked: ${repoTinaDir}`);
  console.error(`  Checked: ${fallbackTinaDir}`);
  // Don't crash — we can still start the server and return helpful errors
  tinaDir = fallbackTinaDir;
}

// Log what generated files we can find
const generatedDir = path.join(tinaDir, '__generated__');
const schemaJsonPath = path.join(generatedDir, '_schema.json');
const graphqlJsonPath = path.join(generatedDir, '_graphql.json');
const lookupJsonPath = path.join(generatedDir, '_lookup.json');

console.log(`Schema JSON exists: ${existsSync(schemaJsonPath)}`);
console.log(`GraphQL JSON exists: ${existsSync(graphqlJsonPath)}`);
console.log(`Lookup JSON exists: ${existsSync(lookupJsonPath)}`);

// ---------------------------------------------------------------------------
// TinaCMS Data Layer setup — wrapped in try-catch to prevent crash-on-boot
// ---------------------------------------------------------------------------
let database = null;
try {
  database = createLocalDatabase();
  console.log('Local database created successfully');
} catch (err) {
  console.error('Failed to create local database:', err.message);
  console.error('The GraphQL endpoint will return errors until the database is available');
}

// ---------------------------------------------------------------------------
// Health check — returns structured JSON, never HTML
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    status: database ? 'ok' : 'degraded',
    message: 'TinaCMS backend is running',
    database: database ? 'connected' : 'unavailable',
    tinaDir,
    schemaExists: existsSync(schemaJsonPath),
    graphqlExists: existsSync(graphqlJsonPath),
    lookupExists: existsSync(lookupJsonPath),
  });
});

// Diagnostics endpoint — helps debug production issues
app.get('/health', (req, res) => {
  const generatedFiles = ['_schema.json', '_graphql.json', '_lookup.json', 'config.prebuild.jsx'];
  const fileStatus = {};
  for (const file of generatedFiles) {
    const filePath = path.join(generatedDir, file);
    fileStatus[file] = existsSync(filePath);
  }

  // Check content directory
  const contentPaths = [
    path.resolve('/app/repo/src/content/pages'),
    path.resolve('/app/src/content/pages'),
    path.resolve(__dirname, '../src/content/pages'),
  ];
  const contentStatus = {};
  for (const p of contentPaths) {
    contentStatus[p] = existsSync(p);
  }

  res.json({
    status: database ? 'ok' : 'degraded',
    tinaDir,
    generatedFiles: fileStatus,
    contentDirectories: contentStatus,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: port,
      TINA_ADMIN_PASSWORD_HASH: process.env.TINA_ADMIN_PASSWORD_HASH ? 'set' : 'NOT SET',
      TINA_JWT_SECRET: process.env.TINA_JWT_SECRET ? 'set' : 'NOT SET',
    },
  });
});

// Auth endpoint
app.post('/api/auth/login', login);

// Rebuild trigger (production only)
const triggerRebuild = () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Triggering local rebuild inside container...');
    exec('sh /app/repo/deploy/rebuild.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Rebuild error: ${error}`);
        return;
      }
      console.log(`Rebuild stdout: ${stdout}`);
      console.error(`Rebuild stderr: ${stderr}`);
    });
  }
};

// ---------------------------------------------------------------------------
// GraphQL endpoint — POST only, with auth
// ---------------------------------------------------------------------------
app.post('/graphql', authenticate, async (req, res) => {
  if (!database) {
    return res.status(503).json({
      errors: [{ message: 'Database not initialized. Check server logs.' }],
    });
  }

  const { query, variables } = req.body;

  if (!query) {
    return res.status(400).json({
      errors: [{ message: 'Missing "query" in request body' }],
    });
  }

  try {
    const result = await resolve({
      config: {
        configPath: path.join(tinaDir, 'config.ts'),
      },
      database,
      query,
      variables,
    });

    // Trigger rebuild if this was a mutation (save) with no errors
    if (query.includes('mutation') && result.errors === undefined) {
      triggerRebuild();
    }

    res.json(result);
  } catch (error) {
    console.error('GraphQL resolve error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({
      errors: [{
        message: error.message || 'Internal GraphQL error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }],
    });
  }
});

// ---------------------------------------------------------------------------
// Handle GET on /graphql — TinaCMS admin may probe this endpoint
// ---------------------------------------------------------------------------
app.get('/graphql', (req, res) => {
  res.json({
    message: 'TinaCMS GraphQL endpoint. Use POST with { query, variables }.',
    status: database ? 'ok' : 'degraded',
  });
});

// ---------------------------------------------------------------------------
// Catch-all for unmatched routes — always return JSON, never HTML
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    errors: [{ message: `Not Found: ${req.method} ${req.url}` }],
  });
});

// Global error handler — ensures JSON responses for all errors
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 500).json({
    errors: [{ message: err.message || 'Internal Server Error' }],
  });
});

app.listen(port, () => {
  console.log(`TinaCMS backend listening at http://localhost:${port}`);
  console.log(`Tina directory: ${tinaDir}`);
  console.log(`Database status: ${database ? 'initialized' : 'FAILED'}`);
});
