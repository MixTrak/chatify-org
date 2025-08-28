import { NextRequest, NextResponse } from 'next/server';
import { createGroup, getUserGroups } from '@/lib/group';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, createdBy, memberIds, maxMembers = 10 } = body;
    
    if (!name || !createdBy || !memberIds || !Array.isArray(memberIds)) {
      return NextResponse.json({ 
        error: 'Name, createdBy, and memberIds array are required' 
      }, { status: 400 });
    }

    if (name.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Group name must be at least 3 characters long' 
      }, { status: 400 });
    }

    if (maxMembers < 2 || maxMembers > 10) {
      return NextResponse.json({ 
        error: 'Group size must be between 2 and 10 members' 
      }, { status: 400 });
    }

    const result = await createGroup(name, description || '', createdBy, memberIds, maxMembers);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      groupId: result.groupId 
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const groups = await getUserGroups(userId);
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error getting user groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
