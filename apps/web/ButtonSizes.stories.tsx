import type { Meta, StoryObj } from '@storybook/react';
import { Button } from 'ui';

const meta = {
  title: 'Web/Interactive Buttons',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    onClick: { action: 'clicked' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Default: Story = {
  args: {
    children: 'Default Size',
    size: 'default',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const IconButton: Story = {
  args: {
    children: '🚀',
    size: 'icon',
  },
};

export const OutlinedLarge: Story = {
  args: {
    children: 'Outlined Large',
    size: 'lg',
    variant: 'outline',
  },
};

export const GhostSmall: Story = {
  args: {
    children: 'Ghost Small',
    size: 'sm',
    variant: 'ghost',
  },
};