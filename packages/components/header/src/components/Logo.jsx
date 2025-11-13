import React from 'react';

export default function Logo({ 
  logoSrc = '../../assets/rounded.png',
  title = 'Symphony',
  subtitle = 'AI-FIRST DEVELOPMENT',
  className = ''
}) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Symphony Logo */}
      <div className="relative">
        <img 
          src={logoSrc} 
          alt={title}
          className="h-7 w-7" 
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Title and Subtitle */}
      <div>
        <h1 className="text-base font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="text-[10px] text-text-tertiary font-medium tracking-wide">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
