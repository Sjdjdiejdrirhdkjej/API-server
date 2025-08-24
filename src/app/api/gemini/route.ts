import { GoogleGenAI } from '@google/genai';
import { auth } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { geminiUsageSchema } from '@/models/Schema';

const ai = new GoogleGenAI(Env.GEMINI_API_KEY);
const RATE_LIMIT = 10;

export const POST = async (request: Request) => {
  const { userId } = auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Rate limiting logic
  const usage = await db
    .select()
    .from(geminiUsageSchema)
    .where(eq(geminiUsageSchema.userId, userId));

  if (usage.length === 0) {
    await db.insert(geminiUsageSchema).values({ userId, requestCount: 1 });
  } else {
    const userUsage = usage[0];

    if (userUsage.requestCount >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    await db
      .update(geminiUsageSchema)
      .set({ requestCount: sql`${geminiUsageSchema.requestCount} + 1` })
      .where(eq(geminiUsageSchema.userId, userId));
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

    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 },
    );
  }
};
