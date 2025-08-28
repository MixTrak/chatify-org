'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Group, GroupMessage } from '@/lib/group';
import { UserProfile } from '@/lib/user';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import CustomCursor from '@/components/CustomCursor';
import PerformanceOptimizer from '@/components/PerformanceOptimizer';

const GroupModal = dynamic(() => import('@/components/GroupModal'), { ssr: false });
const AddMemberModal = dynamic(() => import('@/components/AddMemberModal'), { ssr: false });

export default function GroupChatPage() {
  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [kickingUser, setKickingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  // Fetch group data
  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const groupData = await response.json();
        setGroup(groupData);
        
        // Fetch group members
        if (groupData.members.length > 0) {
          const membersResponse = await fetch(`/api/users/bulk?uids=${groupData.members.join(',')}`);
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            setGroupMembers(membersData);
          } else {
            console.error('Failed to fetch members:', membersResponse.status);
          }
        } else {
          setGroupMembers([]);
        }
        
        // Check if current user is admin
        if (userProfile) {
          setIsAdmin(groupData.admins.includes(userProfile.uid));
        }
      } else {
        console.error('Failed to fetch group');
        router.push('/message');
      }
    } catch {
      console.error('Error fetching group');
      router.push('/message');
    }
  }, [groupId, router, userProfile]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    
    try {
      const response = await fetch(`/api/groups/${groupId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch {
      console.error('Error fetching messages');
    }
  }, [groupId]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userProfile || !groupId) return;

    setSending(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userProfile.uid,
          content: newMessage.trim(),
          type: 'text'
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      } else {
        console.error('Failed to send message');
      }
    } catch {
      console.error('Error sending message');
    } finally {
      setSending(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage || !userProfile || !groupId) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const { imageId } = await uploadResponse.json();
        
        const messageResponse = await fetch(`/api/groups/${groupId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: userProfile.uid,
            content: '📷 Image',
            type: 'image',
            imageId
          })
        });

        if (messageResponse.ok) {
          setSelectedImage(null);
          setImagePreview('');
          fetchMessages();
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Kick member from group
  const kickMember = async (userId: string, memberName: string) => {
    if (!userProfile || !isAdmin) return;
    
    if (!confirm(`Are you sure you want to kick ${memberName} from the group?`)) {
      return;
    }
    
    setKickingUser(userId);
    try {
      const response = await fetch(`/api/groups/${groupId}/members?userId=${userId}&removedBy=${userProfile.uid}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchGroup();
        fetchMessages();
      } else {
        const data = await response.json();
        alert(`Failed to kick member: ${data.error}`);
      }
    } catch {
      alert('Error kicking member. Please try again.');
    } finally {
      setKickingUser(null);
    }
  };

  // Add member to group
  const addMemberToGroup = async (userId: string) => {
    if (!userProfile || !isAdmin) return;
    
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          addedBy: userProfile.uid
        })
      });
      
      if (response.ok) {
        // Wait a moment for the database to update, then refresh
        setTimeout(async () => {
          await fetchGroup();
          await fetchMessages();
        }, 500);
        setAddMemberModalOpen(false);
      } else {
        const data = await response.json();
        alert(`Failed to add member: ${data.error}`);
      }
    } catch {
      alert('Error adding member. Please try again.');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!firebaseUser) {
      router.push('/signup');
      return;
    }

    if (userProfile) {
      fetchGroup();
      fetchMessages();
    }
    
    setLoading(false);
  }, [firebaseUser, userProfile, authLoading, router, fetchGroup, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format time
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get sender name
  const getSenderName = (senderId: string) => {
    const sender = groupMembers.find(member => member.uid === senderId);
    return sender?.displayName || sender?.username || 'Unknown User';
  };

  // Get sender avatar
  const getSenderAvatar = (senderId: string) => {
    const sender = groupMembers.find(member => member.uid === senderId);
    return sender?.photoURL || 'https://via.placeholder.com/40';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Group Not Found</h1>
          <Link href="/message" className="btn btn-primary">Back to Messages</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PerformanceOptimizer />
      <CustomCursor>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/message" className="btn btn-ghost btn-sm text-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#5865f2] text-white flex items-center justify-center text-xl font-bold">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
                  <p className="text-sm text-gray-600">{group.members.length} members</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="btn btn-outline btn-sm text-black"
                  title="Edit Group Info"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="btn btn-outline btn-sm text-black"
                title={showMembers ? "Hide Members" : "Show Members"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
                {showMembers ? "Hide" : "Members"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="container mx-auto px-4 py-6">
        <div className={`${showMembers ? 'max-w-6xl' : 'max-w-4xl'} mx-auto`}>
          <div className="flex gap-6">
            {/* Messages Section */}
            <div className={`${showMembers ? 'flex-1' : 'w-full'} bg-white rounded-lg shadow-lg overflow-hidden`}>
              <div className="h-[600px] overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">No Messages Yet!</h3>
                    <p className="text-gray-600">This Is The Beginning Of A Legendary Conversation</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.senderId === userProfile?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.senderId === userProfile?.uid ? '' : 'flex items-end space-x-2'}`}>
                        {message.senderId !== userProfile?.uid && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={getSenderAvatar(message.senderId)}
                              alt={getSenderName(message.senderId)}
                              width={32}
                              height={32}
                            />
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-lg ${
                          message.senderId === userProfile?.uid
                            ? 'bg-primary text-primary-content'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {message.senderId !== userProfile?.uid && (
                            <div className="text-xs font-medium text-gray-600 mb-1">
                              {getSenderName(message.senderId)}
                            </div>
                          )}
                          {message.type === 'image' && message.imageId ? (
                            <div>
                              <Image
                                src={`/api/images/${message.imageId}`}
                                alt="Message image"
                                width={300}
                                height={200}
                                className="max-w-full h-auto rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                }}
                              />
                              <div className="text-xs mt-1 opacity-70">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="break-words">{message.content}</div>
                              <div className="text-xs mt-1 opacity-70">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="bg-white border-t p-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost btn-sm text-black"
                    title="Attach image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedImage(file);
                        const reader = new FileReader();
                        reader.onload = (e) => setImagePreview(e.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 input input-bordered text-black"
                    disabled={sending}
                  />

                  {selectedImage ? (
                    <button
                      onClick={handleImageUpload}
                      disabled={sending}
                      className="btn btn-primary btn-sm"
                    >
                      {sending ? 'Sending...' : 'Send Image'}
                    </button>
                  ) : (
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="btn btn-primary btn-sm"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  )}
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded border"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                      }}
                      className="absolute -top-2 -right-2 btn btn-circle btn-xs bg-red-500 text-white"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Member Sidebar */}
            {showMembers && (
              <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Members ({groupMembers.length})</h3>
                </div>
                <div className="h-[520px] overflow-y-auto p-4">
                  <div className="space-y-3">
                    {groupMembers.map((member) => {
                      const isMemberAdmin = group.admins.includes(member.uid);
                      const canKick = isAdmin && !isMemberAdmin && member.uid !== userProfile?.uid;
                      
                      return (
                        <div key={member.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              <Image
                                src={member.photoURL || 'https://via.placeholder.com/40'}
                                alt={member.displayName}
                                width={40}
                                height={40}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{member.displayName}</div>
                              <div className="text-sm text-gray-500">@{member.username}</div>
                              {isMemberAdmin && (
                                <span className="text-xs bg-[#5865f2] text-white px-2 py-1 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                          {canKick && (
                            <button
                              onClick={() => kickMember(member.uid, member.displayName)}
                              disabled={kickingUser === member.uid}
                              className="btn btn-error btn-xs"
                              title="Kick member"
                            >
                              {kickingUser === member.uid ? (
                                <div className="loading loading-spinner loading-xs"></div>
                              ) : (
                                'Kick'
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isAdmin && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setAddMemberModalOpen(true)}
                      className="btn btn-primary w-full"
                      disabled={group.members.length >= 10}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Add Member
                      {group.members.length >= 10 && (
                        <span className="ml-2 text-xs opacity-75">(Max reached)</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Group Modal */}
      <GroupModal
        isOpen={editModalOpen}
        mode="edit"
        group={group}
        onClose={() => setEditModalOpen(false)}
        onGroupUpdated={() => {
          fetchGroup();
        }}
      />
      
      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onAddMember={addMemberToGroup}
        existingMembers={group?.members || []}
        groupName={group?.name || ''}
      />
        </div>
      </CustomCursor>
    </>
  );
}
