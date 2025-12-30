import React from 'react';
import { Flex, Box, Heading, Text } from 'ui';

export default function Logo({ 
  logoSrc = '../../assets/rounded.png',
  title = 'Symphony',
  subtitle = 'AI-FIRST DEVELOPMENT',
  className = ''
}) {
  return (
    <Flex align="center" gap={3} className={className}>
      {/* Symphony Logo */}
      <Box className="relative">
        <Box 
          as="img"
          src={logoSrc} 
          alt={title}
          className="h-7 w-7" 
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = 'none';
          }}
        />
      </Box>
      
      {/* Title and Subtitle */}
      <Box>
        <Heading level={1} className="text-base font-semibold tracking-tight text-text-primary">
          {title}
        </Heading>
        <Text className="text-[10px] text-text-tertiary font-medium tracking-wide">
          {subtitle}
        </Text>
      </Box>
    </Flex>
  );
}
