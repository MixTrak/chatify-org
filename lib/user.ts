import { getDatabase } from './mongodb';
import { User } from 'firebase/auth';

export interface UserProfile {
  _id?: string;
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bannerColor?: string;
  createdAt: Date;
  lastSeen: Date;
  pronouns?: string;
  bio?: string;
  links?: { title: string; url: string }[];
}

export async function createUser(user: User, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    // Check if user already exists (idempotent signup)
    const existingUserByUid = await usersCollection.findOne({ uid: user.uid });
    if (existingUserByUid) {
      // If the profile already exists, treat as success
      return { success: true };
    }

    // Check if username already exists and belongs to a different user
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser && existingUser.uid !== user.uid) {
      return { success: false, error: 'Username already exists' };
    }
    
    const userProfile = {
      uid: user.uid,
      email: user.email || '',
      username,
      displayName: user.displayName || username,
      photoURL: user.photoURL || undefined,
      bannerColor: '#5865f2',
      createdAt: new Date(),
      lastSeen: new Date(),
    };
    
    await usersCollection.insertOne(userProfile);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function getUserByUid(uid: string): Promise<UserProfile | null> {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ uid }) as UserProfile | null;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ username }) as UserProfile | null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

export async function searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    const regex = new RegExp(query, 'i');
    const users = await usersCollection
      .find({
        $and: [
          { uid: { $ne: currentUserId } },
          {
            $or: [
              { username: regex },
              { displayName: regex },
              { email: regex }
            ]
          }
        ]
      })
      .limit(10)
      .toArray();
    
    return users as unknown as UserProfile[];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export async function updateUserProfile(
  uid: string,
  profileData: {
    username?: string;
    displayName?: string;
    pronouns?: string;
    bio?: string;
    links?: { title: string; url: string }[];
    bannerColor?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    // If username is being updated, check if it already exists
    if (profileData.username) {
      const existingUser = await usersCollection.findOne({ 
        username: profileData.username,
        uid: { $ne: uid } // Exclude current user
      });
      
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }
    }
    
    // Validate links (max 5)
    if (profileData.links && profileData.links.length > 5) {
      return { success: false, error: 'Maximum 5 links allowed' };
    }
    
    // Update user profile
    const updateResult = await usersCollection.updateOne(
      { uid },
      { $set: { ...profileData, lastSeen: new Date() } }
    );
    
    if (updateResult.matchedCount === 0) {
      return { success: false, error: 'User not found' };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function updateLastSeen(uid: string): Promise<void> {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { uid },
      { $set: { lastSeen: new Date() } }
    );
  } catch (error) {
    console.error('Error updating last seen:', error);
  }
}

// getUserByUid function is already defined above
