'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface HeroSectionProps {
  onStartMessaging: () => void;
  isLoading: boolean;
}

export default function HeroSection({ onStartMessaging, isLoading }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <motion.div 
      ref={containerRef}
      className="hero min-h-screen relative overflow-hidden"
      style={{ y, opacity, scale }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="hero-content text-center relative z-10">
        <motion.div 
          className="max-w-4xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold text-gray-800 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            Connect with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Friends
            </span>
          </motion.h1>
          
          <motion.p 
            className="py-6 text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            A modern messaging platform built with Next.js, Firebase, and MongoDB. 
            Send text messages and images, connect with friends, and stay in touch.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <motion.button 
              onClick={onStartMessaging}
              className="btn btn-primary btn-lg text-lg px-8 py-4 interactive"
              disabled={isLoading}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                'Start Messaging'
              )}
            </motion.button>
            
          </motion.div>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-4 h-4 bg-blue-400 rounded-full opacity-60"
        animate={{
          y: [0, -20, 0],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-60"
        animate={{
          y: [0, 15, 0],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </motion.div>
  );
}
