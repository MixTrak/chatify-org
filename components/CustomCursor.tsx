'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CustomCursorProps {
  children: React.ReactNode;
}

export default function CustomCursor({ children }: CustomCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isOverButton, setIsOverButton] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
      setIsVisible(true);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Add hover listeners for interactive elements
    const interactiveElements = document.querySelectorAll('a, .interactive');
    const buttonElements = document.querySelectorAll('button');
    
    const handleElementEnter = () => setIsHovering(true);
    const handleElementLeave = () => setIsHovering(false);
    
    const handleButtonEnter = () => setIsOverButton(true);
    const handleButtonLeave = () => setIsOverButton(false);

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleElementEnter);
      el.addEventListener('mouseleave', handleElementLeave);
    });
    
    buttonElements.forEach(el => {
      el.addEventListener('mouseenter', handleButtonEnter);
      el.addEventListener('mouseleave', handleButtonLeave);
    });

    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleElementEnter);
        el.removeEventListener('mouseleave', handleElementLeave);
      });
      
      buttonElements.forEach(el => {
        el.removeEventListener('mouseenter', handleButtonEnter);
        el.removeEventListener('mouseleave', handleButtonLeave);
      });
    };
  }, [mouseX, mouseY]);

  // Don't render cursor if over button
  if (isOverButton) {
    return (
      <>
        <style jsx global>{`
          body {
            cursor: auto !important;
          }
          body * {
            cursor: auto !important;
          }
        `}</style>
        {children}
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          cursor: none !important;
        }
        body * {
          cursor: none !important;
        }
      `}</style>
      
      {children}
      
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
        }}
      >
        <div 
          className="w-8 h-8 rounded-full backdrop-blur-sm border-2"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(0, 0, 0, 0.3)',
            boxShadow: isHovering 
              ? '0 0 20px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.1)' 
              : '0 0 10px rgba(0, 0, 0, 0.2)'
          }}
        />
      </motion.div>
      
      {/* Reveal effect layer */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-40"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovering ? 2 : 0,
          opacity: isHovering ? 0.1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <div 
          className="w-16 h-16 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)',
            backdropFilter: 'blur(10px)',
          }}
        />
      </motion.div>
    </>
  );
}
