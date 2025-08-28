import { NextRequest, NextResponse } from 'next/server';
import { addMemberToGroup, removeMemberFromGroup } from '@/lib/group';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { userId, addedBy } = body;
    
    if (!groupId || !userId || !addedBy) {
      return NextResponse.json({ 
        error: 'Group ID, userId, and addedBy are required' 
      }, { status: 400 });
    }

    const result = await addMemberToGroup(groupId, userId, addedBy);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding member to group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const removedBy = searchParams.get('removedBy');
    
    if (!groupId || !userId || !removedBy) {
      return NextResponse.json({ 
        error: 'Group ID, userId, and removedBy are required' 
      }, { status: 400 });
    }

    const result = await removeMemberFromGroup(groupId, userId, removedBy);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member from group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
