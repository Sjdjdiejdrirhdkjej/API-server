import type { FullConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { clerkSetup } from '@clerk/testing/playwright';

async function globalSetup(_config: FullConfig) {
  const envFile = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf-8');
  const clerkSecretKey = envFile
    .split('\n')
    .find(line => line.startsWith('CLERK_SECRET_KEY='))
    ?.split('=')[1];

  await clerkSetup({
    secretKey: clerkSecretKey,
  });
}

export default globalSetup;
