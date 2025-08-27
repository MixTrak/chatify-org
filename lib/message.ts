import { getDatabase, getGridFSBucket } from './mongodb';
import { ObjectId } from 'mongodb';

export interface Message {
  _id?: ObjectId;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image';
  imageId?: string; // GridFS file ID for images
  timestamp: Date;
  read: boolean;
}

export async function sendMessage(
  senderId: string, 
  receiverId: string, 
  content: string, 
  type: 'text' | 'image' = 'text', 
  imageId?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    const message: Message = {
      senderId,
      receiverId,
      content,
      type,
      imageId,
      timestamp: new Date(),
      read: false,
    };
    
    const result = await messagesCollection.insertOne(message);
    return { success: true, messageId: result.insertedId.toString() };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function getMessages(userId1: string, userId2: string): Promise<Message[]> {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    const messages = await messagesCollection
      .find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      })
      .sort({ timestamp: 1 })
      .toArray();
    
    return messages as Message[];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

export async function markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    await messagesCollection.updateMany(
      { senderId, receiverId, read: false },
      { $set: { read: true } }
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

export async function clearMessages(userId1: string, userId2: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    const bucket = await getGridFSBucket();
    
    // First, find all image messages between these users to delete from GridFS
    const imageMessages = await messagesCollection
      .find({
        $or: [
          { senderId: userId1, receiverId: userId2, type: 'image' },
          { senderId: userId2, receiverId: userId1, type: 'image' }
        ]
      })
      .toArray();
    
    // Delete each image from GridFS
    for (const message of imageMessages) {
      if (message.imageId) {
        try {
          await bucket.delete(new ObjectId(message.imageId));
        } catch (err) {
          console.error(`Failed to delete image ${message.imageId}:`, err);
          // Continue with other deletions even if one fails
        }
      }
    }
    
    // Delete all messages between these users
    await messagesCollection.deleteMany({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing messages:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function uploadImage(file: File): Promise<{ success: boolean; error?: string; imageId?: string }> {
  try {
    const bucket = await getGridFSBucket();
    const buffer = await file.arrayBuffer();
    const stream = bucket.openUploadStream(file.name, {
      metadata: {
        contentType: file.type,
        size: file.size,
      }
    });
    
    stream.write(Buffer.from(buffer));
    stream.end();
    
    return new Promise((resolve) => {
      stream.on('finish', () => {
        resolve({ success: true, imageId: stream.id.toString() });
      });
      
      stream.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function getImageUrl(imageId: string): Promise<string> {
  try {
    const bucket = await getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        resolve(`data:image/jpeg;base64,${base64}`);
      });
      
      downloadStream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '';
  }
}

export interface Conversation {
  userId: string;
  displayName: string;
  username: string;
  photoURL?: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    isFromUser: boolean;
    type: 'text' | 'image';
  };
  unreadCount: number;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    const usersCollection = db.collection('users');
    
    // Find all unique users that the current user has exchanged messages with
    const sentMessages = await messagesCollection.aggregate([
      { $match: { senderId: userId } },
      { $group: { _id: "$receiverId" } }
    ]).toArray();
    
    const receivedMessages = await messagesCollection.aggregate([
      { $match: { receiverId: userId } },
      { $group: { _id: "$senderId" } }
    ]).toArray();
    
    // Combine unique user IDs
    const uniqueUserIds = [...new Set(
      [...sentMessages.map(item => item._id), 
       ...receivedMessages.map(item => item._id)]
    )];
    
    // For each unique user, get the latest message and user info
    const conversations: Conversation[] = [];
    
    for (const otherUserId of uniqueUserIds) {
      // Get user profile
      const otherUser = await usersCollection.findOne({ uid: otherUserId });
      if (!otherUser) continue;
      
      // Get latest message between users
      const latestMessage = await messagesCollection.find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
      
      if (latestMessage.length === 0) continue;
      
      // Count unread messages
      const unreadCount = await messagesCollection.countDocuments({
        senderId: otherUserId,
        receiverId: userId,
        read: false
      });
      
      conversations.push({
        userId: otherUserId,
        displayName: otherUser.displayName,
        username: otherUser.username,
        photoURL: otherUser.photoURL,
        lastMessage: {
          content: latestMessage[0].content,
          timestamp: latestMessage[0].timestamp,
          isFromUser: latestMessage[0].senderId === userId,
          type: latestMessage[0].type
        },
        unreadCount
      });
    }
    
    // Sort conversations by the timestamp of the last message (newest first)
    return conversations.sort((a, b) => 
      b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
    );
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}
