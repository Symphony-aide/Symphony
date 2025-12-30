import React from 'react';
import { Flex, Box } from 'ui';

export default function AnimatedLogo({ 
  logoSrc = '../../assets/logo.png',
  alt = 'Symphony',
  size = 'h-32 w-32',
  className = ''
}) {
  return (
    <Flex justify="center" className={`mb-8 ${className}`}>
      <Box className="relative animate-float">
        <img 
          src={logoSrc} 
          alt={alt}
          className={`${size} drop-shadow-2xl`}
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = 'none';
          }}
        />
        {/* Glow effect */}
        <Box className="absolute inset-0 bg-symphony-primary/20 blur-3xl rounded-full animate-pulse-slow" />
      </Box>
    </Flex>
  );
}
