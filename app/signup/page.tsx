'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signInWithGoogle } from '@/lib/firebase';
import CustomCursor from '@/components/CustomCursor';
import PerformanceOptimizer from '@/components/PerformanceOptimizer';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const { user, error: firebaseError } = await signInWithGoogle();
      
      if (firebaseError) {
        setError(firebaseError);
        setLoading(false);
        return;
      }

      if (user && user.email) {
        // Extract username from email (remove everything after and including '@')
        const emailUsername = user.email.split('@')[0];

        // Fire-and-forget profile creation; Firebase auth is already established.
        // We redirect immediately to provide a snappy UX. The API is idempotent.
        fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName ?? emailUsername,
              photoURL: user.photoURL,
            },
            username: emailUsername,
          }),
        }).catch(() => {
          // Non-blocking error; profile creation will be retried on next load if needed
        });

        router.push('/message');
        return;
      } else {
        setError('Email is required for signup');
      }
    } catch {
      setError('An error occurred during Google signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PerformanceOptimizer />
      <CustomCursor>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <motion.div 
            className="card w-full max-w-md bg-white shadow-xl"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <div className="card-body">
              <motion.h2 
                className="card-title text-2xl font-bold text-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
              >
                Create Account
              </motion.h2>
          
          {error && (
            <motion.div 
              className="alert alert-error mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-semibold">{error}</span>
              </div>
            </motion.div>
          )}

          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <p className="text-gray-600 mb-4">
              Sign up with your Google account to start messaging
            </p>
          </motion.div>

          <motion.button
            onClick={handleGoogleSignup}
            className={`btn btn-primary w-full interactive ${loading ? 'loading' : ''}`}
            disabled={loading}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing up...' : 'Continue with Google'}
          </motion.button>
            </div>
          </motion.div>
        </div>
      </CustomCursor>
    </>
  );
}
