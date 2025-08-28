import { NextRequest, NextResponse } from 'next/server';
import { getGroup, updateGroup } from '@/lib/group';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const group = await getGroup(groupId);
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error getting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { name, description, avatarURL, updatedBy } = body;
    
    if (!groupId || !updatedBy) {
      return NextResponse.json({ error: 'Group ID and updatedBy are required' }, { status: 400 });
    }

    if (name && name.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Group name must be at least 3 characters long' 
      }, { status: 400 });
    }

    const updates: { name?: string; description?: string; avatarURL?: string } = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatarURL !== undefined) updates.avatarURL = avatarURL;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const result = await updateGroup(groupId, updates, updatedBy);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
