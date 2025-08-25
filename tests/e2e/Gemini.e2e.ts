import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

test.describe('Gemini API', () => {
  test('should return a successful response', async ({ page, request }) => {
    const session = await clerk.createSession();
    await session.authenticateAs('user_2iJ5dJ6f3Z5gA3bX2eC2gH1jY1Z');
    await clerk.setCookies(page.context());

    const response = await request.post('/api/gemini', {
      data: {
        prompt: 'hello',
      },
    });

    expect(response.ok()).toBeTruthy();

    const json = await response.json();

    expect(json).toHaveProperty('text');
  });

  test('should return a rate limit error', async ({ page, request }) => {
    const session = await clerk.createSession();
    await session.authenticateAs('user_2iJ5dJ6f3Z5gA3bX2eC2gH1jY1Z');
    await clerk.setCookies(page.context());

    for (let i = 0; i < 10; i += 1) {
      const response = await request.post('/api/gemini', {
        data: {
          prompt: 'hello',
        },
      });

      expect(response.ok()).toBeTruthy();
    }

    const response = await request.post('/api/gemini', {
      data: {
        prompt: 'hello',
      },
    });

    expect(response.status()).toBe(429);
  });
});
