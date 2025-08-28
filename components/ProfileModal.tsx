'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: Pick<UserProfile, 'uid' | 'username' | 'displayName' | 'photoURL'> | { uid: string };
}

export default function ProfileModal({ isOpen, onClose, targetUser }: ProfileModalProps) {
  const { firebaseUser, loading: authLoading, fetchUserProfile } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);

  const addLink = () => {
    if (links.length < 5) setLinks([...links, { title: '', url: '' }]);
  };
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const isFormDirty = () => {
    if (!profile) return false;
    if (username !== profile.username) return true;
    if (displayName !== profile.displayName) return true;
    if (pronouns !== (profile.pronouns || '')) return true;
    if (bio !== (profile.bio || '')) return true;
    const profileLinks = profile.links || [];
    if (links.length !== profileLinks.length) return true;
    for (let i = 0; i < links.length; i++) {
      if (!links[i].title && !links[i].url) continue;
      if (i >= profileLinks.length) return true;
      if (links[i].title !== profileLinks[i].title) return true;
      if (links[i].url !== profileLinks[i].url) return true;
    }
    return false;
  };

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    
    try {
      setIsLoading(true);
      setError('');
      const uidToLoad = targetUser?.uid || firebaseUser.uid;
      
      // Always fetch fresh data from server for live updates
      const res = await fetch(`/api/users/profile?uid=${uidToLoad}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = (await res.json()) as UserProfile;
      
      setProfile(data);
      setUsername(data.username || '');
      setDisplayName(data.displayName || '');
      setPronouns(data.pronouns || '');
      setBio(data.bio || '');
      setLinks(data.links || []);
      if ((data.links || []).length === 0) setLinks([{ title: '', url: '' }]);
    } catch {
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, targetUser?.uid]);

  useEffect(() => {
    if (!isOpen) return;
    if (authLoading) return;
    if (!firebaseUser) {
      setError('You must be logged in to view your profile.');
      setIsLoading(false);
      return;
    }
    
    // Always refresh profile data when modal opens
    refreshProfile();
  }, [isOpen, authLoading, firebaseUser, targetUser?.uid, refreshProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    try {
      setError('');
      setSuccessMessage('');
      if (!username.trim()) return setError('Username is required');
      if (!displayName.trim()) return setError('Display name is required');
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return setError('Username can only contain letters, numbers, and underscores');
      const filtered = links.filter(l => l.title.trim() && l.url.trim());
      for (const l of filtered) { try { new URL(l.url); } catch { return setError(`Invalid URL format for link: ${l.title}`); } }
      const resp = await fetch('/api/users/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: firebaseUser.uid, username, displayName, pronouns, bio, links: filtered, bannerColor: profile?.bannerColor })
      });
      if (!resp.ok) { const d = await resp.json(); throw new Error(d.error || 'Failed to update profile'); }
      const updated = (await resp.json()) as UserProfile;
      setProfile(updated);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      
      // Refresh the profile data in the auth context if this is the current user
      if (!targetUser && firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSuccessMessage('');
    }
  };

  if (!isOpen) return null;

  const isSelf = !!firebaseUser && (!!targetUser ? targetUser.uid === firebaseUser.uid : true);

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
          className={`absolute inset-0 ${isSelf ? 'bg-transparent' : 'bg-black/60'}`} 
          onClick={() => {
            if (isFormDirty() && isEditing) {
              if (!window.confirm('Close without saving changes?')) return;
            }
            onClose();
          }}
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
          onClick={() => {
            if (isFormDirty() && isEditing) {
              if (!window.confirm('Close without saving changes?')) return;
            }
            onClose();
          }}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29 10.59 10.6l6.3-6.31z"/></svg>
        </button>
        {/* Banner */}
        <div
          className="relative h-28"
          style={{ background: profile?.bannerColor || '#5865f2' }}
        />
        {/* Avatar */}
        <div className="relative px-6">
          <div className="absolute -top-10">
            {profile?.photoURL ? (
              <Image src={profile.photoURL} alt={profile.displayName} width={80} height={80} className="rounded-full border-4 border-[#313338]" />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-[#313338] bg-[#5865f2] text-white flex items-center justify-center text-2xl font-bold">
                {(profile?.displayName?.charAt(0) || profile?.username?.charAt(0) || '?').toUpperCase()}
              </div>
            )}
          </div>
          <div className="pt-8 pb-2" />
        </div>
        {/* Body */}
        <div className="px-6 pb-6 text-white">
          {isLoading ? (
            <div className="py-12 text-center text-[#b5bac1]">Loading...</div>
          ) : !firebaseUser ? (
            <div className="py-12 text-center text-[#f23f42]">Login required.</div>
          ) : !isEditing ? (
            <div>
              <div className="flex items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold tracking-tight">{profile?.displayName}</h2>
                  <p className="text-[#b5bac1]">@{profile?.username}
                    {profile?.uid && (
                      <span className="ml-2 text-[10px] align-middle bg-[#2b2d31] text-[#b5bac1] px-2 py-0.5 rounded">#
                        {profile.uid.substring(0, 4).toUpperCase()}
                      </span>
                    )}
                  </p>
                  {profile?.pronouns && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#b5bac1]">{profile.pronouns}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={refreshProfile} 
                    className="bg-[#2b2d31] hover:bg-[#232428] text-white font-medium px-3 py-2 rounded-md"
                    title="Refresh profile data"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                  </button>
                  {isSelf && (
                    <button onClick={() => { setIsEditing(true); setSuccessMessage(''); }} className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium px-4 py-2 rounded-md">Edit Profile</button>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="rounded-lg bg-[#2b2d31] border border-[#1e1f22] p-4">
                  <h3 className="text-xs font-semibold uppercase text-[#b5bac1]">About Me</h3>
                  <p className="mt-2 text-[#dbdee1] whitespace-pre-wrap">{profile?.bio || 'No bio yet.'}</p>
                </div>
                <div className="rounded-lg bg-[#2b2d31] border border-[#1e1f22] p-4">
                  <h3 className="text-xs font-semibold uppercase text-[#b5bac1]">Links</h3>
                  {profile?.links && profile.links.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {profile.links.map((link, index) => (
                        <li key={index}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1e1f22] hover:bg-[#232428] text-[#dbdee1]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5Zm7-3h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 0 0 0-6h-3V9Z"/></svg>
                            <span className="truncate">{link.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[#b5bac1]">No links added.</p>
                  )}
                </div>
              </div>
              {successMessage && (
                <div className="mt-4 rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#3db67e] px-4 py-2">{successMessage}</div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSelf && (
                <div className="rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#f23f42] px-4 py-2">You can only edit your own profile.</div>
              )}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1" htmlFor="username">Username</label>
                  <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!isSelf} className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1" htmlFor="displayName">Display Name</label>
                  <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!isSelf} className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1" htmlFor="bannerColor">Banner Color</label>
                  <div className="flex items-center gap-2">
                    <input id="bannerColor" type="color" value={profile?.bannerColor || '#5865f2'} onChange={(e) => setProfile(prev => prev ? { ...prev, bannerColor: e.target.value } as UserProfile : prev)} disabled={!isSelf} className="h-10 w-16 rounded border border-[#1e1f22] bg-[#1e1f22]" />
                    <input type="text" value={profile?.bannerColor || '#5865f2'} onChange={(e) => setProfile(prev => prev ? { ...prev, bannerColor: e.target.value } as UserProfile : prev)} disabled={!isSelf} className="flex-1 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1" htmlFor="pronouns">Pronouns</label>
                  <input id="pronouns" type="text" value={pronouns} onChange={(e) => setPronouns(e.target.value)} disabled={!isSelf} placeholder="e.g. he/him, she/her, they/them" className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1" htmlFor="bio">About Me</label>
                  <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} disabled={!isSelf} rows={4} placeholder="Tell us about yourself" className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#b5bac1] mb-1">Links (Max 5)</label>
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="text" value={link.title} onChange={(e) => updateLink(index, 'title', e.target.value)} disabled={!isSelf} placeholder="Title" className="w-1/3 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" />
                        <input type="url" value={link.url} onChange={(e) => updateLink(index, 'url', e.target.value)} disabled={!isSelf} placeholder="https://example.com" className="flex-1 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-60" />
                        {isSelf && (
                          <button type="button" onClick={() => removeLink(index)} className="px-3 py-2 rounded-md bg-[#f23f42] hover:bg-[#da3a3d] text-white">Remove</button>
                        )}
                      </div>
                    ))}
                    {isSelf && links.length < 5 && (
                      <button type="button" onClick={addLink} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1e1f22] hover:bg-[#232428] text-[#dbdee1]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2h5Z"/></svg>
                        Add Link
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => {
                  if (isFormDirty()) {
                    if (!window.confirm('Cancel without saving changes?')) return;
                  }
                  setIsEditing(false);
                }} className="px-4 py-2 rounded-md bg-[#2b2d31] hover:bg-[#232428] text-[#dbdee1]">Cancel</button>
                {isSelf && (
                  <button type="submit" className="px-4 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium">Save Changes</button>
                )}
              </div>
              {error && (<div className="rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#f23f42] px-4 py-2">{error}</div>)}
            </form>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


