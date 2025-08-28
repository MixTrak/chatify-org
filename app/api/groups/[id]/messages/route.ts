import { NextRequest, NextResponse } from 'next/server';
import { sendGroupMessage, getGroupMessages } from '@/lib/group';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { senderId, content, type = 'text', imageId } = body;
    
    if (!groupId || !senderId || !content) {
      return NextResponse.json({ 
        error: 'Group ID, senderId, and content are required' 
      }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message content cannot be empty' 
      }, { status: 400 });
    }

    const result = await sendGroupMessage(groupId, senderId, content, type, imageId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const beforeDate = before ? new Date(before) : undefined;
    const messages = await getGroupMessages(groupId, limit, beforeDate);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error getting group messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
