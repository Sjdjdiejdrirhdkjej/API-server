import { GoogleGenAI } from '@google/genai';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { headers } from 'next/headers';

import { Env } from '@/libs/Env';

const ai = new GoogleGenAI(Env.GEMINI_API_KEY);

const API_KEY_RATE_LIMIT = 500;
const SESSION_RATE_LIMIT = 10;

type ApiKeyData = {
  id: string;
  keyPrefix: string;
  keyHash: string;
  label: string;
  createdAt: string;
  usage: {
    count: number;
    date: string;
  };
};

type GeminiUsage = {
  requestCount: number;
  updatedAt: string;
};

export const POST = async (request: Request) => {
  let userId: string | null = null;
  let apiKeyId: string | null = null;
  let authMethod: 'session' | 'apiKey';

  const authorization = headers().get('Authorization');

  if (authorization?.startsWith('Bearer ')) {
    authMethod = 'apiKey';
    const apiKey = authorization.substring(7);
    const [keyUserId, secret] = apiKey.split('_');

    if (!keyUserId || !secret) {
      return new Response('Invalid API Key format', { status: 401 });
    }

    try {
      const user = await clerkClient.users.getUser(keyUserId);
      const apiKeys = (user.privateMetadata.apiKeys || []) as ApiKeyData[];
      const hashedSecret = createHash('sha256').update(secret).digest('hex');
      const matchingKey = apiKeys.find((key) => key.keyHash === hashedSecret);

      if (!matchingKey) {
        return new Response('Invalid API Key', { status: 401 });
      }

      userId = keyUserId;
      apiKeyId = matchingKey.id;
    } catch (error) {
      return new Response('Invalid API Key', { status: 401 });
    }
  } else {
    authMethod = 'session';
    const session = auth();
    if (!session.userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    userId = session.userId;
  }

  // Rate Limiting
  const user = await clerkClient.users.getUser(userId);
  const today = new Date().toISOString().split('T')[0];

  if (authMethod === 'apiKey') {
    const apiKeys = (user.privateMetadata.apiKeys || []) as ApiKeyData[];
    const keyIndex = apiKeys.findIndex((key) => key.id === apiKeyId);

    if (keyIndex === -1) {
      return new Response('API Key not found', { status: 500 });
    }

    const keyData = apiKeys[keyIndex]!;
    const usage = keyData.usage || { count: 0, date: today };

    if (usage.date === today && usage.count >= API_KEY_RATE_LIMIT) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    apiKeys[keyIndex]!.usage = {
      count: usage.date === today ? usage.count + 1 : 1,
      date: today,
    };

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { ...user.privateMetadata, apiKeys },
    });
  } else { // Session-based rate limiting
    const geminiUsage = user.privateMetadata.geminiUsage as GeminiUsage | undefined;

    if (geminiUsage && geminiUsage.requestCount >= SESSION_RATE_LIMIT) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        geminiUsage: {
          requestCount: (geminiUsage?.requestCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);

    // Revert rate limit count on error
    const currentUser = await clerkClient.users.getUser(userId);
    if (authMethod === 'apiKey') {
      const apiKeys = (currentUser.privateMetadata.apiKeys || []) as ApiKeyData[];
      const keyIndex = apiKeys.findIndex((key) => key.id === apiKeyId);
      if (keyIndex !== -1) {
        apiKeys[keyIndex]!.usage.count -= 1;
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: { ...currentUser.privateMetadata, apiKeys },
        });
      }
    } else {
      const geminiUsage = currentUser.privateMetadata.geminiUsage as GeminiUsage;
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...currentUser.privateMetadata,
          geminiUsage: { ...geminiUsage, requestCount: geminiUsage.requestCount - 1 },
        },
      });
    }

    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
};
