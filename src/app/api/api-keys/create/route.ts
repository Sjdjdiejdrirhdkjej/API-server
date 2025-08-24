import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { randomBytes } from 'crypto';

export const POST = async () => {
  const { userId } = auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Generate a new API key
  const keyId = `key_${randomBytes(8).toString('hex')}`;
  const secret = `sk_${randomBytes(32).toString('hex')}`;
  const apiKey = `${userId}_${secret}`;

  // Hash the secret part of the API key
  const hashedSecret = createHash('sha256').update(secret).digest('hex');

  // Get user's current metadata
  const user = await clerkClient.users.getUser(userId);
  const apiKeys = (user.privateMetadata.apiKeys || []) as {
    id: string;
    keyPrefix: string;
    keyHash: string;
    label: string;
    createdAt: string;
  }[];

  // Add the new key
  apiKeys.push({
    id: keyId,
    keyPrefix: `${userId}_`,
    keyHash: hashedSecret,
    label: 'My new key', // A default label
    createdAt: new Date().toISOString(),
  });

  // Update user's metadata
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      apiKeys,
    },
  });

  // Return the full, un-hashed API key
  return NextResponse.json({ apiKey });
};
