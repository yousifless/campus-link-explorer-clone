
import React from 'react';
import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link to="/" className={`flex items-center space-x-2 ${className}`}>
      <motion.div
        whileHover={{ rotate: 10 }}
        whileTap={{ scale: 0.95 }}
        className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-brand-purple to-brand-pink`}
      >
        <Network className="h-4/6 w-4/6 text-white" strokeWidth={2.5} />
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      </motion.div>
      
      {withText && (
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`font-bold ${textSizes[size]} font-display`}
        >
          Campus<span className="text-brand-pink">Link</span>
        </motion.div>
      )}
    </Link>
  );
}

export default Logo;
