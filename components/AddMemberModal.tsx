'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/user';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (userId: string) => void;
  existingMembers: string[];
  groupName: string;
}

export default function AddMemberModal({ 
  isOpen, 
  onClose, 
  onAddMember, 
  existingMembers,
  groupName 
}: AddMemberModalProps) {
  const { userProfile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError('');
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userProfile) return;

    setSearching(true);
    setError('');
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${userProfile.uid}`);
      if (response.ok) {
        const results = await response.json();
        // Filter out users already in the group
        const filteredResults = results.filter((user: UserProfile) => 
          !existingMembers.includes(user.uid)
        );
        setSearchResults(filteredResults);
        
        if (filteredResults.length === 0 && results.length > 0) {
          setError('All found users are already members of this group');
        }
      } else {
        setError('Failed to search users');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = (userId: string, userName: string) => {
    if (confirm(`Add ${userName} to ${groupName}?`)) {
      onAddMember(userId);
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
          className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden border border-[#1e1f22] bg-[#313338] shadow-2xl"
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
          <h2 className="text-xl font-bold mb-4">Add Member to {groupName}</h2>

          {error && (
            <div className="mb-4 rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#f23f42] px-4 py-2">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1">
                Search Users
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]"
                  placeholder="Search by username..."
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
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#b5bac1] mb-2">Search Results:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.uid} className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-md border border-[#1e1f22]">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={user.photoURL || 'https://via.placeholder.com/40'}
                            alt={user.displayName}
                            width={40}
                            height={40}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-[#dbdee1]">{user.displayName}</div>
                          <div className="text-sm text-[#b5bac1]">@{user.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(user.uid, user.displayName)}
                        className="px-3 py-1 rounded bg-[#3db67e] hover:bg-[#2d8f5f] text-white text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSearched && searchQuery && searchResults.length === 0 && !searching && !error && (
              <div className="text-center py-4 text-[#b5bac1]">
                No users found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
