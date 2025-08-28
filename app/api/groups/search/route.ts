import { NextRequest, NextResponse } from 'next/server';
import { searchGroups } from '@/lib/group';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const currentUserId = searchParams.get('currentUserId');
    
    if (!query || !currentUserId) {
      return NextResponse.json({ 
        error: 'Search query and currentUserId are required' 
      }, { status: 400 });
    }

    if (query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Search query must be at least 2 characters long' 
      }, { status: 400 });
    }

    const groups = await searchGroups(query, currentUserId);
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error searching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
