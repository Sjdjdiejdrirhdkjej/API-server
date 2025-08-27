import { auth, clerkClient } from '@clerk/nextjs/server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

import { Env } from '@/libs/Env';

const ai = new GoogleGenAI({ apiKey: Env.GEMINI_API_KEY });
const RATE_LIMIT = 10;

type GeminiUsage = {
  requestCount: number;
  updatedAt: string;
};

export const POST = async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = await clerkClient();

  // Rate limiting logic using Clerk metadata
  const user = await client.users.getUser(userId);
  const geminiUsage = user.privateMetadata.geminiUsage as
    | GeminiUsage
    | undefined;

  if (!geminiUsage) {
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        geminiUsage: {
          requestCount: 1,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  } else {
    if (geminiUsage.requestCount >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        geminiUsage: {
          requestCount: geminiUsage.requestCount + 1,
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
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    const text = result.text;

    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);

    // If Gemini API fails, we should probably revert the request count
    const currentUser = await client.users.getUser(userId);
    const currentGeminiUsage = currentUser.privateMetadata.geminiUsage as
      | GeminiUsage
      | undefined;

    if (currentGeminiUsage) {
      await client.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...currentUser.privateMetadata,
          geminiUsage: {
            ...currentGeminiUsage,
            requestCount: currentGeminiUsage.requestCount - 1,
          },
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 },
    );
  }
};
