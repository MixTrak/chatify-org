import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/user';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, username } = body;
    
    if (!user || !username) {
      return NextResponse.json({ error: 'User and username are required' }, { status: 400 });
    }

    // Create user profile with Google authentication
    const result = await createUser(user, username);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
