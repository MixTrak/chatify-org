'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Group } from '@/lib/group';
import { UserProfile } from '@/lib/user';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  group?: Group;
  onGroupCreated?: (groupId: string) => void;
  onGroupUpdated?: () => void;
}

export default function GroupModal({ 
  isOpen, 
  onClose, 
  mode, 
  group, 
  onGroupCreated, 
  onGroupUpdated 
}: GroupModalProps) {
  const { firebaseUser, userProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [groupMembers, setGroupMembers] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchGroupMembers = useCallback(async () => {
    if (!group) return;
    
    try {
      const response = await fetch(`/api/users/profile?uid=${group.members.join(',')}`);
      if (response.ok) {
        const membersData = await response.json();
        setGroupMembers(Array.isArray(membersData) ? membersData : [membersData]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  }, [group]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (mode === 'edit' && group) {
      setName(group.name);
      setDescription(group.description || '');
      setSelectedUsers(group.members.filter(id => id !== group.createdBy));
      
      // Fetch group members for display
      fetchGroupMembers();
    } else if (mode === 'create') {
      setName('');
      setDescription('');
      setSelectedUsers([]);
      setGroupMembers([]);
    }
    
    setError('');
    setSuccessMessage('');
  }, [isOpen, mode, group, fetchGroupMembers]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userProfile) return;

    setSearching(true);
    setError('');
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${userProfile.uid}`);
      if (response.ok) {
        const results = await response.json();
        // Filter out users already selected
        const filteredResults = results.filter((user: UserProfile) => 
          !selectedUsers.includes(user.uid)
        );
        setSearchResults(filteredResults);
      } else {
        setError('Failed to search users');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const addUser = (userId: string) => {
    if (selectedUsers.length >= 9) { // Max 10 including creator
      setError('Group cannot have more than 10 members');
      return;
    }
    setSelectedUsers([...selectedUsers, userId]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userProfile) return;

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    if (name.trim().length < 3) {
      setError('Group name must be at least 3 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            createdBy: userProfile.uid,
            memberIds: selectedUsers,
            maxMembers: 10
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create group');
        }

        const result = await response.json();
        setSuccessMessage('Group created successfully!');
        onGroupCreated?.(result.groupId);
        setTimeout(() => onClose(), 1500);
      } else if (mode === 'edit' && group) {
        const response = await fetch(`/api/groups/${group._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            updatedBy: userProfile.uid
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update group');
        }

        setSuccessMessage('Group updated successfully!');
        onGroupUpdated?.();
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          className="absolute inset-0 bg-black/60" 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
        <motion.div 
          className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden border border-[#1e1f22] bg-[#313338] shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 25,
            duration: 0.3
          }}
        >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29 10.59 10.6l6.3-6.31z"/>
          </svg>
        </button>

        <div className="p-6 text-white">
          <h2 className="text-2xl font-bold mb-6">
            {mode === 'create' ? 'Create New Group' : mode === 'edit' ? 'Edit Group' : 'Group Details'}
          </h2>

          {error && (
            <div className="mb-4 rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#f23f42] px-4 py-2">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#3db67e] px-4 py-2">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mode === 'view'}
                className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60"
                placeholder="Enter group name"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={mode === 'view'}
                rows={3}
                className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60"
                placeholder="Enter group description"
              />
            </div>

            {(mode === 'create' || mode === 'edit') && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1">
                    {mode === 'create' ? `Add Members (${selectedUsers.length}/9)` : 'Group Members'}
                  </label>
                  
                  {/* Search Users - Only show in create mode */}
                  {mode === 'create' && (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]"
                        placeholder="Search users by username..."
                      />
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-4 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium"
                      >
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  )}

                  {/* Search Results - Only show in create mode */}
                  {mode === 'create' && searchResults.length > 0 && (
                    <div className="mb-3 p-3 bg-[#2b2d31] rounded-md border border-[#1e1f22]">
                      <h4 className="text-sm font-semibold text-[#b5bac1] mb-2">Search Results:</h4>
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <div key={user.uid} className="flex items-center justify-between p-2 bg-[#1e1f22] rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                  src={user.photoURL || 'https://via.placeholder.com/32'}
                                  alt={user.displayName}
                                  width={32}
                                  height={32}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{user.displayName}</div>
                                <div className="text-xs text-[#b5bac1]">@{user.username}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addUser(user.uid)}
                              className="px-3 py-1 rounded bg-[#3db67e] hover:bg-[#2d8f5f] text-white text-sm"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Users - Show in both create and edit modes */}
                  {selectedUsers.length > 0 && (
                    <div className="p-3 bg-[#2b2d31] rounded-md border border-[#1e1f22]">
                      <h4 className="text-sm font-semibold text-[#b5bac1] mb-2">Selected Members:</h4>
                      <div className="space-y-2">
                        {selectedUsers.map((userId) => {
                          // Find user details from group members if in edit mode
                          const userDetails = mode === 'edit' && group ? 
                            groupMembers.find(m => m.uid === userId) : null;
                          
                          return (
                            <div key={userId} className="flex items-center justify-between p-2 bg-[#1e1f22] rounded">
                              <div className="flex items-center space-x-2">
                                {userDetails ? (
                                  <>
                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                      <Image
                                        src={userDetails.photoURL || 'https://via.placeholder.com/32'}
                                        alt={userDetails.displayName}
                                        width={32}
                                        height={32}
                                      />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">{userDetails.displayName}</div>
                                      <div className="text-xs text-[#b5bac1]">@{userDetails.username}</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-sm">
                                      ?
                                    </div>
                                    <div className="text-sm">User ID: {userId.substring(0, 8)}...</div>
                                  </>
                                )}
                              </div>
                              {mode === 'create' && (
                                <button
                                  type="button"
                                  onClick={() => removeUser(userId)}
                                  className="px-3 py-1 rounded bg-[#f23f42] hover:bg-[#da3a3d] text-white text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {mode !== 'view' && (
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-[#2b2d31] hover:bg-[#232428] text-[#dbdee1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium disabled:opacity-60"
                >
                  {loading ? 'Saving...' : mode === 'create' ? 'Create Group' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
