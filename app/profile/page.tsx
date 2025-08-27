'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/lib/user';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { firebaseUser, userProfile: authProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  
  // Add a new empty link
  const addLink = () => {
    if (links.length < 5) {
      setLinks([...links, { title: '', url: '' }]);
    }
  };
  
  // Remove a link at specific index
  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };
  
  // Update link at specific index
  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index][field] = value;
    setLinks(updatedLinks);
  };
  
  // Check if form has been modified
  const isFormDirty = () => {
    if (!profile) return false;
    
    if (username !== profile.username) return true;
    if (displayName !== profile.displayName) return true;
    if (pronouns !== (profile.pronouns || '')) return true;
    if (bio !== (profile.bio || '')) return true;
    
    // Check if links have changed
    const profileLinks = profile.links || [];
    if (links.length !== profileLinks.length) return true;
    
    for (let i = 0; i < links.length; i++) {
      // Skip empty links
      if (!links[i].title && !links[i].url) continue;
      
      // If we have more non-empty links than the profile, form is dirty
      if (i >= profileLinks.length) return true;
      
      if (links[i].title !== profileLinks[i].title) return true;
      if (links[i].url !== profileLinks[i].url) return true;
    }
    
    return false;
  };
  
  // Fetch user profile
  useEffect(() => {
    if (authLoading) return;
    
    if (!firebaseUser) {
      router.push('/login');
      return;
    }
    
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // If we already have the profile from auth context, use it
        if (authProfile) {
          setProfile(authProfile);
          
          // Initialize form state
          setUsername(authProfile.username || '');
          setDisplayName(authProfile.displayName || '');
          setPronouns(authProfile.pronouns || '');
          setBio(authProfile.bio || '');
          setLinks(authProfile.links || []);
          
          if (authProfile.links?.length === 0) {
            // Add one empty link by default if none exist
            setLinks([{ title: '', url: '' }]);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Otherwise fetch from API
        const response = await fetch(`/api/users/profile?uid=${firebaseUser.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
        
        // Initialize form state
        setUsername(data.username || '');
        setDisplayName(data.displayName || '');
        setPronouns(data.pronouns || '');
        setBio(data.bio || '');
        setLinks(data.links || []);
        
        if (data.links?.length === 0) {
          // Add one empty link by default if none exist
          setLinks([{ title: '', url: '' }]);
        }
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [firebaseUser, authProfile, authLoading, router]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccessMessage('');
      
      // Basic validation
      if (!username.trim()) {
        setError('Username is required');
        return;
      }
      
      if (!displayName.trim()) {
        setError('Display name is required');
        return;
      }
      
      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }
      
      // Filter out empty links
      const filteredLinks = links.filter(link => link.title.trim() && link.url.trim());
      
      // Validate URLs
      for (const link of filteredLinks) {
        try {
          new URL(link.url);
        } catch {
          setError(`Invalid URL format for link: ${link.title}`);
          return;
        }
      }
      
      // Ensure firebaseUser is not null before accessing uid
      if (!firebaseUser) {
        setError('User authentication required');
        return;
      }
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          username,
          displayName,
          pronouns,
          bio,
          links: filteredLinks,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setSuccessMessage('');
      console.error('Error updating profile:', err);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#1e1f22]">
        <div className="flex flex-col items-center text-[#dbdee1]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865f2]"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen bg-[#1e1f22]">
      {error && (
        <div className="mb-4 rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#f23f42] px-4 py-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-md border border-[#3f4147] bg-[#2b2d31] text-[#3db67e] px-4 py-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
      <div className="rounded-2xl overflow-hidden border border-[#1e1f22] bg-[#313338] shadow-xl">
        {/* Banner */}
        <div className="relative h-36 bg-gradient-to-r from-[#1e66f5] via-[#5865f2] to-[#a78bfa]">
          <Link href="/message" className="absolute top-3 left-3 text-white/90 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </Link>
        </div>
        {/* Avatar overlaps banner */}
        <div className="relative px-6">
          <div className="absolute -top-10">
            {profile?.photoURL ? (
              <Image src={profile.photoURL} alt={profile.displayName} width={96} height={96} className="rounded-full border-4 border-[#313338]" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-[#313338] bg-[#5865f2] text-white flex items-center justify-center text-3xl font-bold">
                {(profile?.displayName?.charAt(0) || profile?.username?.charAt(0) || '?').toUpperCase()}
              </div>
            )}
          </div>
          <div className="pt-10 pb-4" />
        </div>
        {/* Body */}
        <div className="px-6 pb-6 text-white">
          {!isEditing ? (
            <div>
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">{profile?.displayName}</h2>
                  </div>
                  <p className="text-[#b5bac1]">@{profile?.username}
                    {profile?.uid && (
                      <span className="ml-2 text-xs bg-[#2b2d31] text-[#b5bac1] px-2 py-0.5 rounded">#
                        {profile.uid.substring(0, 4).toUpperCase()}
                      </span>
                    )}
                  </p>
                  {profile?.pronouns && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#b5bac1]">{profile.pronouns}</p>
                  )}
                </div>
                <button
                  onClick={() => { setIsEditing(true); setSuccessMessage(''); }}
                  className="ml-4 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium px-4 py-2 rounded-md"
                >
                  Edit Profile
                </button>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#b5bac1] mb-2" htmlFor="username">Username</label>
                  <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#b5bac1] mb-2" htmlFor="displayName">Display Name</label>
                  <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#b5bac1] mb-2" htmlFor="pronouns">Pronouns</label>
                <input id="pronouns" type="text" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="e.g. he/him, she/her, they/them" className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#b5bac1] mb-2" htmlFor="bio">About Me</label>
                <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell us about yourself" className="w-full rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#b5bac1] mb-2">Links (Max 5)</label>
                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="text" value={link.title} onChange={(e) => updateLink(index, 'title', e.target.value)} placeholder="Title" className="w-1/3 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]" />
                      <input type="url" value={link.url} onChange={(e) => updateLink(index, 'url', e.target.value)} placeholder="https://example.com" className="flex-1 rounded-md border border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] px-3 py-2 outline-none focus:ring-2 focus:ring-[#5865f2]" />
                      <button type="button" onClick={() => removeLink(index)} className="px-3 py-2 rounded-md bg-[#f23f42] hover:bg-[#da3a3d] text-white">Remove</button>
                    </div>
                  ))}
                  {links.length < 5 && (
                    <button type="button" onClick={addLink} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1e1f22] hover:bg-[#232428] text-[#dbdee1]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2h5Z"/></svg>
                      Add Link
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => {
                  if (isFormDirty()) {
                    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                      setIsEditing(false);
                    }
                  } else {
                    setIsEditing(false);
                  }
                }} className="px-4 py-2 rounded-md bg-[#2b2d31] hover:bg-[#232428] text-[#dbdee1]">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium">Save Changes</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}