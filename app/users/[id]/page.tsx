'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserProfile } from '@/lib/user';
import { Message } from '@/lib/message';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatPage() {
  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const otherUserId = params.id as string;

  // Fetch messages
  const fetchMessages = useCallback(async (userId1: string, userId2: string) => {
    try {
      const messagesResponse = await fetch(`/api/messages?userId1=${userId1}&userId2=${userId2}`);
      if (messagesResponse.ok) {
        const chatMessages = await messagesResponse.json();

        const hasNewMessages =
          chatMessages.length > messages.length ||
          (chatMessages.length > 0 &&
            messages.length > 0 &&
            new Date(chatMessages[chatMessages.length - 1].timestamp).getTime() >
              new Date(messages[messages.length - 1].timestamp).getTime());

        if (hasNewMessages) {
          setMessages(chatMessages);

          // mark as read
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderId: userId2,
              receiverId: userId1,
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [messages]);

  // Auth + fetch other user
  useEffect(() => {
    if (authLoading) return;

    if (!firebaseUser) {
      router.push('/login');
      return;
    }

    if (!userProfile) {
      router.push('/signup');
      return;
    }

    const fetchOtherUser = async () => {
      try {
        const otherUserResponse = await fetch(`/api/auth/user?uid=${otherUserId}`);
        if (!otherUserResponse.ok) {
          router.push('/message');
          return;
        }
        const otherUserProfile = await otherUserResponse.json();
        setOtherUser(otherUserProfile);

        await fetchMessages(userProfile.uid, otherUserId);
      } catch (error) {
        console.error('Error loading chat:', error);
        router.push('/message');
      } finally {
        setLoading(false);
      }
    };

    fetchOtherUser();
  }, [router, otherUserId, firebaseUser, userProfile, authLoading, fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!userProfile || !otherUser) return;
    const intervalId = setInterval(() => {
      fetchMessages(userProfile.uid, otherUser.uid);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [userProfile, otherUser, fetchMessages]);

  // Auto-scroll
  const prevMessageCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !userProfile || !otherUser || sending) return;
    setSending(true);
    try {
      let imageId: string | undefined;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        const uploadResponse = await fetch('/api/upload/image', { method: 'POST', body: formData });
        if (!uploadResponse.ok) throw new Error('Failed to upload image');
        const uploadResult = await uploadResponse.json();
        imageId = uploadResult.imageId;
      }

      const messageContent = selectedImage ? '📷 Image' : newMessage.trim();
      const messageType = selectedImage ? 'image' : 'text';

      const optimisticMsg: Message = {
        senderId: userProfile.uid,
        receiverId: otherUser.uid,
        content: messageContent,
        type: messageType,
        imageId,
        timestamp: new Date(),
        read: false,
      };
      setMessages(prev => [...prev, optimisticMsg]);

      setNewMessage('');
      setSelectedImage(null);
      setImagePreview('');

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userProfile.uid,
          receiverId: otherUser.uid,
          content: messageContent,
          type: messageType,
          imageId,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setMessages(prev => prev.filter(msg => msg !== optimisticMsg));
        console.error('Failed to send message');
      } else {
        await fetchMessages(userProfile.uid, otherUser.uid);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Clear messages
  const handleClearMessages = async () => {
    if (!userProfile || !otherUser) return;
    if (confirm('Are you sure you want to clear all messages?')) {
      try {
        const response = await fetch('/api/messages/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId1: userProfile.uid, userId2: otherUser.uid }),
        });
        const result = await response.json();
        if (result.success) {
          setMessages([]);
        } else {
          alert('Failed to clear messages.');
        }
      } catch (error) {
        console.error(error);
        alert('Error clearing messages.');
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!userProfile || !otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <Link href="/message" className="btn btn-primary">Back to Messages</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="navbar bg-white shadow-lg sticky top-0 z-10">
        <div className="navbar-start">
          <Link href="/message" className="btn btn-ghost text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </Link>
        </div>
        <div className="navbar-center">
          <div className="flex items-center space-x-3">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full">
                <Image
                  src={otherUser.photoURL || 'https://via.placeholder.com/40'}
                  alt={otherUser.displayName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="font-semibold text-black">{otherUser.displayName}</div>
              <div className="text-sm text-gray-500">@{otherUser.username}</div>
            </div>
          </div>
        </div>
        <div className="navbar-end">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              <Image
                src={userProfile.photoURL || 'https://via.placeholder.com/40'}
                alt={userProfile.displayName}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              This Is The Beginning Of A Legendary Conversation
            </h3>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.senderId === userProfile.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === userProfile.uid
                    ? 'bg-primary text-primary-content'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t p-4">
        {imagePreview && (
          <div className="mb-4 relative">
            <Image
              src={imagePreview}
              alt="Preview"
              width={300}
              height={200}
              className="max-w-xs h-auto rounded"
            />
            <button
              onClick={removeSelectedImage}
              className="btn btn-circle btn-sm btn-error absolute top-2 right-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-circle btn-outline"
            disabled={sending}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
          </button>

          <button
            onClick={handleClearMessages}
            className="btn btn-circle btn-outline btn-error"
            title="Clear all messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <input
            type="text"
            placeholder="Type a message..."
            className="input input-bordered flex-1 text-black"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={sending}
          />

          <button
            onClick={handleSendMessage}
            className={`btn btn-primary ${sending ? 'loading' : ''}`}
            disabled={sending || (!newMessage.trim() && !selectedImage)}
          >
            {!sending && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
