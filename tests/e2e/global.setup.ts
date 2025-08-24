import { clerkSetup } from '@clerk/testing/playwright';
import type { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const envFile = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf-8');
  const clerkSecretKey = envFile
    .split('\n')
    .find((line) => line.startsWith('CLERK_SECRET_KEY='))
    ?.split('=')[1];

  await clerkSetup({
    secretKey: clerkSecretKey,
  });
}

export default globalSetup;
