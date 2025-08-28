import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface Group {
  _id?: ObjectId;
  name: string;
  description?: string;
  avatarURL?: string;
  createdBy: string; // User ID of creator
  members: string[]; // Array of user IDs
  admins: string[]; // Array of admin user IDs (subset of members)
  maxMembers: number; // Maximum number of members (default 10)
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMessage {
  _id?: ObjectId;
  groupId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  imageId?: string; // GridFS file ID for images
  timestamp: Date;
  readBy: string[]; // Array of user IDs who have read the message
}

export interface GroupConversation {
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  memberCount: number;
  lastMessage: {
    content: string;
    timestamp: Date;
    senderName: string;
    type: 'text' | 'image';
  };
  unreadCount: number;
  isAdmin: boolean;
}

// Create a new group
export async function createGroup(
  name: string,
  description: string,
  createdBy: string,
  memberIds: string[],
  maxMembers: number = 10
): Promise<{ success: boolean; error?: string; groupId?: string }> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    
    // Validate member count
    if (memberIds.length > maxMembers) {
      return { success: false, error: `Group cannot have more than ${maxMembers} members` };
    }
    
    // Ensure creator is included in members
    if (!memberIds.includes(createdBy)) {
      memberIds.push(createdBy);
    }
    
    const group: Group = {
      name: name.trim(),
      description: description.trim(),
      createdBy,
      members: memberIds,
      admins: [createdBy], // Creator is automatically an admin
      maxMembers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await groupsCollection.insertOne(group);
    return { success: true, groupId: result.insertedId.toString() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Get group by ID
export async function getGroup(groupId: string): Promise<Group | null> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    return await groupsCollection.findOne({ _id: new ObjectId(groupId) }) as Group | null;
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
  }
}

// Get groups for a user
export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    
    const groups = await groupsCollection
      .find({ members: userId })
      .sort({ updatedAt: -1 })
      .toArray();
    
    return groups as Group[];
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
}

// Add member to group
export async function addMemberToGroup(
  groupId: string,
  userId: string,
  addedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    
    // Check if user is admin
    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      return { success: false, error: 'Group not found' };
    }
    
    if (!group.admins.includes(addedBy)) {
      return { success: false, error: 'Only admins can add members' };
    }
    
    if (group.members.includes(userId)) {
      return { success: false, error: 'User is already a member' };
    }
    
    if (group.members.length >= group.maxMembers) {
      return { success: false, error: 'Group is at maximum capacity' };
    }
    
    await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $addToSet: { members: userId },
        $set: { updatedAt: new Date() }
      }
    );
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Remove member from group
export async function removeMemberFromGroup(
  groupId: string,
  userId: string,
  removedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    
    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      return { success: false, error: 'Group not found' };
    }
    
    // Only admins can remove members, or users can leave themselves
    if (!group.admins.includes(removedBy) && removedBy !== userId) {
      return { success: false, error: 'Only admins can remove members' };
    }
    
    // Prevent removing the last admin
    if (group.admins.includes(userId) && group.admins.length === 1) {
      return { success: false, error: 'Cannot remove the last admin' };
    }
    
    // Use proper MongoDB typing with type assertion
    const updateOperation = {
      $pull: { 
        members: userId,
        admins: userId 
      },
      $set: { updatedAt: new Date() }
    };
    
    await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      updateOperation as Record<string, unknown>
    );
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Send message to group
export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  content: string,
  type: 'text' | 'image' = 'text',
  imageId?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const db = await getDatabase();
    const groupMessagesCollection = db.collection('groupMessages');
    const groupsCollection = db.collection('groups');
    
    // Verify sender is a member of the group
    const group = await groupsCollection.findOne({ 
      _id: new ObjectId(groupId),
      members: senderId
    });
    
    if (!group) {
      return { success: false, error: 'You are not a member of this group' };
    }
    
    const message: GroupMessage = {
      groupId,
      senderId,
      content,
      type,
      imageId,
      timestamp: new Date(),
      readBy: [senderId], // Sender has read their own message
    };
    
    const result = await groupMessagesCollection.insertOne(message);
    
    // Update group's updatedAt timestamp
    await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { updatedAt: new Date() } }
    );
    
    return { success: true, messageId: result.insertedId.toString() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Get group messages
export async function getGroupMessages(
  groupId: string,
  limit: number = 50,
  before?: Date
): Promise<GroupMessage[]> {
  try {
    const db = await getDatabase();
    const groupMessagesCollection = db.collection('groupMessages');
    
    const query: { groupId: string; timestamp?: { $lt: Date } } = before 
      ? { groupId, timestamp: { $lt: before } }
      : { groupId };
    
    const messages = await groupMessagesCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return messages.reverse() as GroupMessage[];
  } catch (error) {
    console.error('Error getting group messages:', error);
    return [];
  }
}

// Mark group message as read
export async function markGroupMessageAsRead(
  groupId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const db = await getDatabase();
    const groupMessagesCollection = db.collection('groupMessages');
    
    await groupMessagesCollection.updateOne(
      { _id: new ObjectId(messageId), groupId },
      { $addToSet: { readBy: userId } }
    );
  } catch (error) {
    console.error('Error marking group message as read:', error);
  }
}

// Get group conversations for a user
export async function getUserGroupConversations(userId: string): Promise<GroupConversation[]> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    const groupMessagesCollection = db.collection('groupMessages');
    const usersCollection = db.collection('users');
    
    // Get all groups the user is a member of
    const userGroups = await groupsCollection
      .find({ members: userId })
      .toArray() as Group[];
    
    const conversations: GroupConversation[] = [];
    
    for (const group of userGroups) {
      // Get the latest message
      const latestMessage = await groupMessagesCollection
        .find({ groupId: group._id?.toString() })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();
      
      // Count unread messages
      const unreadCount = await groupMessagesCollection.countDocuments({
        groupId: group._id?.toString(),
        timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        readBy: { $ne: userId }
      });
      
      if (latestMessage.length === 0) {
        // Group has no messages yet, show it with a placeholder message
        conversations.push({
          groupId: group._id?.toString() || '',
          groupName: group.name,
          groupAvatar: group.avatarURL,
          memberCount: group.members.length,
          lastMessage: {
            content: 'No messages yet',
            timestamp: group.createdAt, // Use group creation time
            senderName: 'System',
            type: 'text'
          },
          unreadCount,
          isAdmin: group.admins.includes(userId)
        });
      } else {
        // Group has messages, show the latest one
        const sender = await usersCollection.findOne({ uid: latestMessage[0].senderId });
        const senderName = sender?.displayName || sender?.username || 'Unknown User';
        
        conversations.push({
          groupId: group._id?.toString() || '',
          groupName: group.name,
          groupAvatar: group.avatarURL,
          memberCount: group.members.length,
          lastMessage: {
            content: latestMessage[0].content,
            timestamp: latestMessage[0].timestamp,
            senderName,
            type: latestMessage[0].type
          },
          unreadCount,
          isAdmin: group.admins.includes(userId)
        });
      }
    }
    
    // Sort by latest message timestamp
    return conversations.sort((a, b) => 
      b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
    );
  } catch (error) {
    console.error('Error getting user group conversations:', error);
    return [];
  }
}

// Search groups
export async function searchGroups(query: string, currentUserId: string): Promise<Group[]> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    
    const regex = new RegExp(query, 'i');
    const groups = await groupsCollection
      .find({
        $and: [
          { members: { $ne: currentUserId } }, // Exclude groups user is already in
          {
            $or: [
              { name: regex },
              { description: regex }
            ]
          }
        ]
      })
      .limit(10)
      .toArray();
    
    return groups as Group[];
  } catch (error) {
    console.error('Error searching groups:', error);
    return [];
  }
}

// Update group info (admin only)
export async function updateGroup(
  groupId: string,
  updates: {
    name?: string;
    description?: string;
    avatarURL?: string;
  },
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const groupsCollection = db.collection('groups');
    
    // Check if user is admin
    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      return { success: false, error: 'Group not found' };
    }
    
    if (!group.admins.includes(updatedBy)) {
      return { success: false, error: 'Only admins can update group info' };
    }
    
    await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date() 
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
