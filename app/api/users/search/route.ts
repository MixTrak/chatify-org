import { NextRequest, NextResponse } from 'next/server';
import { searchUsers } from '@/lib/user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const currentUserId = searchParams.get('currentUserId');
    
    if (!query || !currentUserId) {
      return NextResponse.json({ error: 'Query and currentUserId are required' }, { status: 400 });
    }

    const users = await searchUsers(query, currentUserId);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
