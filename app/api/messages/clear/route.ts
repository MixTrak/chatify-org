import { NextRequest, NextResponse } from 'next/server';
import { clearMessages } from '@/lib/message';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId1, userId2 } = body;
    
    if (!userId1 || !userId2) {
      return NextResponse.json({ error: 'Both user IDs are required' }, { status: 400 });
    }

    const result = await clearMessages(userId1, userId2);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}