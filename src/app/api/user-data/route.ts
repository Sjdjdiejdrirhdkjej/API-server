import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const GET = async () => {
  const { userId } = auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await clerkClient.users.getUser(userId);

  return NextResponse.json({
    privateMetadata: user.privateMetadata,
  });
};
