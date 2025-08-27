import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, getUserByUid } from '@/lib/user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const user = await getUserByUid(uid);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the request data
    const data = await request.json();
    
    // Validate the request data
    if (!data) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Extract profile fields
    const { uid, username, displayName, pronouns, bio, links, bannerColor } = data;
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Update the user profile
    const result = await updateUserProfile(uid, {
      username,
      displayName,
      pronouns,
      bio,
      links,
      bannerColor
    });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Get the updated user profile
    const updatedUser = await getUserByUid(uid);
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}