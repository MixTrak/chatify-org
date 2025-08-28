'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: "🔐",
    title: "Secure Authentication",
    description: "Firebase-powered authentication with Google login and email/password support.",
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-purple-600/20",
    borderColor: "border-purple-200",
    shadowColor: "shadow-purple-500/20"
  },
  {
    icon: "💬",
    title: "Real-time Messaging",
    description: "Send text messages and images with instant delivery and real-time updates.",
    color: "text-amber-600",
    bgGradient: "from-amber-500/20 to-amber-600/20",
    borderColor: "border-amber-200",
    shadowColor: "shadow-amber-500/20"
  },
  {
    icon: "👥",
    title: "User Discovery",
    description: "Search and connect with other users by username to start conversations.",
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/20 to-emerald-600/20",
    borderColor: "border-emerald-200",
    shadowColor: "shadow-emerald-500/20"
  }
];

export default function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
        duration: 0.6
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    }
  };

  return (
    <div className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full blur-3xl"
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-50 to-pink-100 rounded-full blur-3xl"
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={containerRef}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chatify?
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative"
                variants={cardVariants}
                whileHover={{ 
                  y: -10,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }
                }}
              >
                {/* Hover background effect */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                />
                
                <motion.div 
                  className="card bg-base-100 shadow-xl border border-gray-100 relative z-10 overflow-hidden interactive"
                  whileHover={{ 
                    boxShadow: `0 25px 50px -12px ${feature.shadowColor}`,
                    borderColor: feature.borderColor.replace('border-', '')
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  {/* Animated icon background */}
                  <motion.div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.bgGradient} rounded-full blur-2xl opacity-20`}
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                  />
                  
                  <div className="card-body text-center relative z-10 p-8">
                                         <motion.div 
                       className="text-6xl mb-6"
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
                       {feature.icon}
                     </motion.div>
                    
                    <motion.h3 
                      className={`card-title justify-center text-2xl font-bold mb-4 ${feature.color}`}
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17
                      }}
                    >
                      {feature.title}
                    </motion.h3>
                    
                    <motion.p 
                      className="text-gray-600 leading-relaxed"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.description}
                    </motion.p>
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
