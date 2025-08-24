import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
  const { userId } = auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { keyId } = await request.json();

  if (!keyId) {
    return NextResponse.json({ error: 'Missing keyId' }, { status: 400 });
  }

  // Get user's current metadata
  const user = await clerkClient.users.getUser(userId);
  const apiKeys = (user.privateMetadata.apiKeys || []) as {
    id: string;
    keyHash: string;
    label: string;
    createdAt: string;
  }[];

  // Filter out the key to be deleted
  const updatedApiKeys = apiKeys.filter((key) => key.id !== keyId);

  // Update user's metadata
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      apiKeys: updatedApiKeys,
    },
  });

  return NextResponse.json({ success: true });
};
