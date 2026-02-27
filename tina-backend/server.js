import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createDatabase, createLocalDatabase } from '@tinacms/datalayer';
import { resolve } from '@tinacms/graphql';
import { login, authenticate } from './auth.js';
import path from 'path';
import { exec } from 'child_process';

dotenv.config();

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Auth endpoint
app.post('/api/auth/login', login);

// Rebuild trigger (local)
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

// TinaCMS Data Layer setup
const database = createLocalDatabase();

// GraphQL endpoint
app.post('/graphql', authenticate, async (req, res) => {
  const { query, variables } = req.body;
  try {
    const tinaConfigPath = path.resolve(process.cwd(), '../tina/config.ts');
    // Note: In production, we might need to use the generated schema
    const result = await resolve({
      config: {
        configPath: tinaConfigPath,
      },
      database,
      query,
      variables,
    });

    // Trigger rebuild if this was a mutation (save)
    if (query.includes('mutation') && result.errors === undefined) {
       triggerRebuild();
    }

    res.json(result);
  } catch (error) {
    console.error('GraphQL Error:', error);
    // Log more details about the error to help debugging
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({
      errors: [{
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }]
    });
  }
});

app.listen(port, () => {
  console.log(`TinaCMS backend listening at http://localhost:${port}`);
});
