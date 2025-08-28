'use client';
import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DemoSection from "@/components/DemoSection";
import AnimatedFooter from "@/components/AnimatedFooter";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
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
    <>
      <PerformanceOptimizer />
      <CustomCursor>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navbar */}
        <Navbar currentUser={userProfile} />

        {/* Hero Section */}
        <HeroSection 
          onStartMessaging={handleStartMessaging}
          isLoading={isLoading}
        />

        {/* Features Section */}
        <FeaturesSection />

        {/* Demo Section */}
        <DemoSection />

        {/* Footer */}
        <AnimatedFooter />
      </div>
      </CustomCursor>
    </>
  );
}
