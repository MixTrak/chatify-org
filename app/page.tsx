'use client';
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';

export default function Home() {
  const { firebaseUser, userProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for stored user credentials on component mount
  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  const handleStartMessaging = () => {
    // Check if user is already authenticated via context
    if (firebaseUser || userProfile) {
      router.push('/message');
      return;
    }
    
    // Check localStorage for stored user ID
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        // User has stored credentials, redirect to messages
        router.push('/message');
      } else {
        // No stored credentials, redirect to signup
        router.push('/signup');
      }
    } else {
      // Fallback for SSR
      router.push('/signup');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <Navbar currentUser={userProfile} />

      {/* Hero Section */}
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-gray-800 mb-8">
              Connect with Friends
            </h1>
            <p className="py-6 text-lg text-gray-600 mb-8">
              A modern messaging platform built with Next.js, Firebase, and MongoDB. 
              Send text messages and images, connect with friends, and stay in touch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleStartMessaging}
                className="btn btn-primary btn-lg"
                disabled={isLoading}
              >
                Start Messaging
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose Chatify?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="card-title justify-center text-purple-500">Secure Authentication</h3>
                <p className='text-black'>Firebase-powered authentication with Google login and email/password support.</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="card-title justify-center text-amber-600">Real-time Messaging</h3>
                <p className='text-black'>Send text messages and images with instant delivery and real-time updates.</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="card-title justify-center text-emerald-500">User Discovery</h3>
                <p className='text-black'>Search and connect with other users by username to start conversations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-gray-800 text-white">
        <div>
          <p className="font-bold text-lg mb-2">Chatify</p>
          <p className="text-sm opacity-70">Built with Next.js, Firebase, and MongoDB</p>
          <p className="text-xs opacity-50 mt-2">© 2025 Chatify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
