'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOutUser } from '@/lib/firebase';
import { UserProfile } from '@/lib/user';
import { Conversation } from '@/lib/message';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ProfileModal = dynamic(() => import('@/components/ProfileModal'), { ssr: false });

export default function MessageDashboard() {
  const { firebaseUser, userProfile, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const router = useRouter();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize
    
    if (!firebaseUser) {
      router.push('/signup');
      return;
    }

    if (userProfile) {
      // Fetch conversations after getting user profile
      fetchConversations(userProfile.uid);
      setLoading(false);
    } else if (!authLoading) {
      // If auth is done loading and we still don't have a user profile, redirect to signup
      router.push('/signup');
    }
  }, [firebaseUser, userProfile, authLoading, router]);
  
  const fetchConversations = async (userId: string) => {
    setLoadingConversations(true);
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userProfile) return;

    setSearching(true);
    setSearchError(''); // Clear any previous errors
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${userProfile.uid}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Error searching users:', response.status, response.statusText);
        // Clear previous results on error
        setSearchResults([]);
        setSearchError('Failed to search users. Please try again later.');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      // Clear previous results on error
      setSearchResults([]);
      setSearchError('Network error. Please check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="navbar bg-white shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            Next-Message
          </Link>
        </div>
        <div className="navbar-center">
          <h1 className="text-xl font-semibold text-black">Messages</h1>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <Image
                  alt="Profile"
                  src={userProfile?.photoURL || "https://via.placeholder.com/40"}
                  width={40}
                  height={40}
                />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <div className="text-sm opacity-70 text-black">
                  {userProfile?.displayName}
                </div>
              </li>
              <li><div className="text-xs opacity-50 text-black">@{userProfile?.username}</div></li>
              <li><div className="divider my-1 invisible"></div></li>
              <li><button className='text-black' onClick={() => { setProfileTarget(undefined as unknown as UserProfile); setProfileModalOpen(true); }}>My Profile</button></li>
              <li><div className="divider my-1 invisible"></div></li>
              <li><button onClick={handleLogout} className='text-black'>Logout</button></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-1">
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4 text-black">Search Users</h2>
                
                <div className="form-control">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Search by username..."
                      className="input input-bordered flex-1 text-black"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      className="btn btn-primary mt-1"
                      onClick={handleSearch}
                      disabled={searching}
                    >
                      {searching ? (
                        <div className="loading loading-spinner loading-sm"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {searchError && (
                  <div className="alert alert-error mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{searchError}</span>
                  </div>
                )}

                {searchResults.length > 0 && !searchError && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-black">Search Results</h3>
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                <Image
                                  src={user.photoURL || 'https://via.placeholder.com/40'}
                                  alt={user.displayName}
                                  width={40}
                                  height={40}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-black">{user.displayName}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="btn btn-primary btn-sm ml-1"
                              onClick={() => { setProfileTarget(user); setProfileModalOpen(true); }}
                            >
                              View Profile
                            </button>
                            <Link
                              href={`/users/${user.uid}`}
                              className="btn btn-primary btn-sm"
                            >
                              Message
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4 text-black">Recent Conversations</h2>
                
                {loadingConversations ? (
                  <div className="flex justify-center py-12">
                    <div className="loading loading-spinner loading-lg"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2 text-black">No Conversations Yet</h3>
                  </div>
                ) : (
                  <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[600px]">
                    {conversations.map((conversation) => (
                      <Link 
                        href={`/users/${conversation.userId}`} 
                        key={conversation.userId}
                        className="block hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between p-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="avatar">
                                <div className="w-12 h-12 rounded-full">
                                  <Image
                                    src={conversation.photoURL || 'https://via.placeholder.com/40'}
                                    alt={conversation.displayName}
                                    width={48}
                                    height={48}
                                  />
                                </div>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{conversation.displayName}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage.isFromUser && 'You: '}
                                {conversation.lastMessage.type === 'image' ? '📷 Image' : conversation.lastMessage.content}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} targetUser={profileTarget || undefined} />
    </div>
  );
}
