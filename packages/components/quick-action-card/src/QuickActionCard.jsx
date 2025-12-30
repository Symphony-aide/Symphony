import React from 'react';
import { Card, Button, Flex, Box, Heading, Text } from 'ui';

export default function QuickActionCard({ 
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'primary',
  className = ''
}) {
  const variantColors = {
    primary: {
      bg: 'bg-symphony-primary/10',
      hoverBg: 'group-hover:bg-symphony-primary/20',
      text: 'text-symphony-primary',
      shadow: 'hover:shadow-symphony-primary/10'
    },
    light: {
      bg: 'bg-symphony-light/10',
      hoverBg: 'group-hover:bg-symphony-light/20',
      text: 'text-symphony-light',
      shadow: 'hover:shadow-symphony-light/10'
    },
    dark: {
      bg: 'bg-symphony-dark/10',
      hoverBg: 'group-hover:bg-symphony-dark/20',
      text: 'text-symphony-dark',
      shadow: 'hover:shadow-symphony-dark/10'
    },
    accent: {
      bg: 'bg-symphony-accent/10',
      hoverBg: 'group-hover:bg-symphony-accent/20',
      text: 'text-symphony-accent',
      shadow: 'hover:shadow-symphony-accent/10'
    }
  };

  const colors = variantColors[variant] || variantColors.primary;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`
        group w-full h-auto
        bg-bg-primary/70 backdrop-blur-md
        border border-border-default
        rounded-xl p-6
        hover:bg-bg-tertiary/80
        transition-all duration-300
        hover:scale-105 hover:shadow-xl ${colors.shadow}
        ${className}
      `}
    >
      <Flex direction="column" align="center" gap={3}>
        {/* Icon Container */}
        <Box className={`
          p-3 rounded-lg transition-all
          ${colors.bg} ${colors.hoverBg}
        `}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </Box>

        {/* Text Content */}
        <Flex direction="column" align="center">
          <Heading as="h6" className="font-semibold text-text-primary mb-1">
            {title}
          </Heading>
          <Text size="sm" className="text-text-tertiary">
            {description}
          </Text>
        </Flex>
      </Flex>
    </Button>
  );
}
