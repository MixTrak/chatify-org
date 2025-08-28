'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function DemoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const mockups = [
    {
      title: "Real-time Chat",
      description: "Instant messaging with live updates",
      gradient: "from-blue-500/20 to-purple-600/20",
      borderColor: "border-blue-200",
      icon: "💬"
    },
    {
      title: "User Profiles",
      description: "Connect with friends and discover new users",
      gradient: "from-emerald-500/20 to-teal-600/20",
      borderColor: "border-emerald-200",
      icon: "👤"
    },
    {
      title: "Image Sharing",
      description: "Share photos and media instantly",
      gradient: "from-pink-500/20 to-rose-600/20",
      borderColor: "border-pink-200",
      icon: "📸"
    }
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-full blur-3xl"
          animate={{
            x: [0, 25, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            Experience{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chatify
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            Discover the features that make Chatify the perfect messaging platform for staying connected with friends and family.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {mockups.map((mockup, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
                transition={{
                  duration: 0.6,
                  delay: 0.6 + index * 0.2,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                whileHover={{ 
                  y: -15,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }
                }}
              >
                {/* Mockup container */}
                <motion.div 
                  className={`relative bg-white rounded-2xl shadow-xl border ${mockup.borderColor} overflow-hidden interactive`}
                  whileHover={{ 
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    scale: 1.02
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  {/* Animated background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${mockup.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  />
                  
                  {/* Mockup content */}
                  <div className="relative z-10 p-8">
                    {/* Icon */}
                                         <motion.div 
                       className="text-6xl mb-6 text-center"
                       whileHover={{ 
                         scale: 1.2,
                         rotate: 5
                       }}
                       transition={{
                         type: "spring",
                         stiffness: 400,
                         damping: 10
                       }}
                     >
                       {mockup.icon}
                     </motion.div>
                    
                    {/* Title */}
                    <motion.h3 
                      className="text-2xl font-bold text-center text-gray-800 mb-4"
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17
                      }}
                    >
                      {mockup.title}
                    </motion.h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-center leading-relaxed">
                      {mockup.description}
                    </p>
                    
                    {/* Mockup preview area */}
                    <motion.div 
                      className="mt-6 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 relative overflow-hidden"
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                    >
                      {/* Animated elements inside mockup */}
                      <motion.div
                        className="absolute top-4 left-4 w-3 h-3 bg-blue-500 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.5
                        }}
                      />
                      <motion.div
                        className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.7
                        }}
                      />
                      <motion.div
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-400 rounded-full"
                        animate={{
                          scaleX: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.3
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
