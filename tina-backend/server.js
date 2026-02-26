import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createDatabase, createLocalDatabase } from '@tinacms/datalayer';
import { createAndExportRouter } from '@tinacms/graphql';
import { login, authenticate } from './auth.js';
import path from 'path';
import fs from 'fs';
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
    console.log('Triggering local rebuild...');
    exec('cd /app/repo && pnpm build && rsync -a --delete dist/ /var/www/public/eosclub/dist/', (error, stdout, stderr) => {
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
const isProd = process.env.NODE_ENV === 'production';
const database = createLocalDatabase(); // Use LevelDB for indexing

// Create TinaCMS GraphQL Router
// We need to point to the project's tina/config.ts
// The Dockerfile will ensure it's at /app/tina/config.ts or similar
const tinaConfigPath = path.resolve(process.cwd(), '../tina/config.ts');

const tinaRouter = await createAndExportRouter({
  database,
  configPath: tinaConfigPath,
});

// Protect GraphQL endpoint
app.use('/graphql', authenticate, tinaRouter);

app.listen(port, () => {
  console.log(`TinaCMS backend listening at http://localhost:${port}`);
});
