import { NextRequest, NextResponse } from 'next/server';
import { getMessages, sendMessage, markMessagesAsRead } from '@/lib/message';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId1 = searchParams.get('userId1');
    const userId2 = searchParams.get('userId2');
    
    if (!userId1 || !userId2) {
      return NextResponse.json({ error: 'Both userId1 and userId2 are required' }, { status: 400 });
    }

    const messages = await getMessages(userId1, userId2);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content, type = 'text', imageId } = body;
    
    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'senderId, receiverId, and content are required' }, { status: 400 });
    }

    // Send the message - this will automatically create a new message with the current timestamp
    // which will cause this conversation to be hoisted to the top when getUserConversations is called
    const result = await sendMessage(senderId, receiverId, content, type, imageId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId } = body;
    
    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'senderId and receiverId are required' }, { status: 400 });
    }

    await markMessagesAsRead(senderId, receiverId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
