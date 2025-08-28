import { NextRequest, NextResponse } from 'next/server';
import { getUserByUid } from '@/lib/user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uids = searchParams.get('uids');
    
    if (!uids) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }
    
    const userIds = uids.split(',').filter(uid => uid.trim());
    
    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No valid user IDs provided' }, { status: 400 });
    }
    
    const users = [];
    
    for (const uid of userIds) {
      const user = await getUserByUid(uid.trim());
      if (user) {
        users.push(user);
      }
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting bulk user profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
