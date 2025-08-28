import { NextRequest, NextResponse } from 'next/server';
import { getUserGroupConversations } from '@/lib/group';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const conversations = await getUserGroupConversations(userId);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error getting group conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
