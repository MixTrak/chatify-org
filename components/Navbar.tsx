'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutUser } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/user';
import Image from 'next/image';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ProfileModal = dynamic(() => import('./ProfileModal'), { ssr: false });

interface NavbarProps {
  currentUser: UserProfile | null;
}

const Navbar: React.FC<NavbarProps> = ({
  currentUser: propCurrentUser,
}) => {
  const pathname = usePathname();
  const { firebaseUser, userProfile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Use provided currentUser prop if available, otherwise use from context
  const activeUser = propCurrentUser || userProfile;

  const handleLogout = async () => {
    try {
      await signOutUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar bg-white shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-primary mr-1.75 btn-sm sm:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16"></path>
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link href="/" className={`btn-outline text-blue-400 mr-4 ${isActive('/') ? 'active' : ''}`}>Home</Link></li>
            {!firebaseUser ? (
              <>
                <li><Link href="/signup" className={`btn-outline text-blue-400 mr-4 ${isActive('/signup') ? 'active' : ''}`}>Signup</Link></li>
              </>
            ) : (
              <li><Link href="/message" className={`btn-outline text-blue-400 ${isActive('/message') ? 'active' : ''}`}>Messages</Link></li>
            )}
          </ul>
        </div>
        <Link href="/" className=" text-xl font-bold text-black">
          Chatify
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/" className={`btn-outline text-blue-400 mr-4 ${isActive('/') ? '' : ''} ${!isActive('/') ? '' : ''}`}>Home</Link></li>
          {!firebaseUser ? (
            <>
              <li><Link href="/signup" className={`btn-outline text-blue-400 ${isActive('/signup') ? 'btn-active' : ''} ${!isActive('/') ? 'btn-active' : ''}`}>Signup</Link></li>
            </>
          ) : (
            <li><Link href="/message" className={`btn-outline text-blue-400 ${isActive('/message') ? 'btn-active' : ''} ${!isActive('/') ? 'btn-active' : ''}`}>Messages</Link></li>
          )}
        </ul>
      </div>
      
      <div className="navbar-end">
        {!firebaseUser ? (
          <Link href="/signup" className="btn btn-primary btn-lg">Get Started</Link>
        ) : activeUser ? (
          <>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <Image
                  src={activeUser.photoURL || 'https://via.placeholder.com/40'}
                  alt="User"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <div className="text-sm opacity-70 text-black">
                  {activeUser.displayName}
                </div>
              </li>
              <li><div className="text-xs opacity-50 text-black">@{activeUser.username}</div></li>
              <li><div className="divider my-1 invisible"></div></li>
              <li><button onClick={() => setIsProfileOpen(true)} className='text-black'>Profile</button></li>
              <li><div className="divider my-1 invisible"></div></li>
              <li><Link href="/message" className='text-black'>Messages</Link></li>
              <li><div className="divider my-1 invisible"></div></li>
              <li><button onClick={handleLogout} className='text-black'>Logout</button></li>
            </ul>
          </div>
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
          </>
        ) : (
          <Link href="/message" className="btn btn-primary">Messages</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
