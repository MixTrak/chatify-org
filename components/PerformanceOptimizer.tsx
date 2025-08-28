'use client';
import { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Preload critical resources
    const preloadImages = () => {
      const imageUrls = [
        '/ChatifyLogo.png',
        // Add other critical images here
      ];
      
      imageUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      });
    };

    // Optimize animations for reduced motion preference
    const handleReducedMotion = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
        document.documentElement.style.setProperty('--animation-delay', '0s');
      }
    };

    // Optimize for high refresh rate displays
    const optimizeForHighRefreshRate = () => {
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
        if (connection?.effectiveType === '4g' || connection?.effectiveType === '5g') {
          document.documentElement.style.setProperty('--animation-smoothness', '0.8');
        }
      }
    };

    // Initialize optimizations
    preloadImages();
    handleReducedMotion();
    optimizeForHighRefreshRate();

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', handleReducedMotion);

    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotion);
    };
  }, []);

  return null;
}
