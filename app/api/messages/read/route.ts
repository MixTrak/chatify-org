import { NextRequest, NextResponse } from 'next/server';
import { markMessagesAsRead } from '@/lib/message';

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId } = await request.json();
    
    if (!senderId || !receiverId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    await markMessagesAsRead(senderId, receiverId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'An unknown error occurred' }, { status: 500 });
  }
}