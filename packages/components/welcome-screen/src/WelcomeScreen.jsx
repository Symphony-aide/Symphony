import React from 'react';
import { FolderOpen, FileText, GitBranch, Sparkles, Clock, HelpCircle, BookOpen } from 'lucide-react';
import { Button } from 'ui';
import AnimatedLogo from './components/AnimatedLogo.jsx';
import { QuickActionCard } from '@symphony/quick-action-card';

export default function WelcomeScreen({ 
  logoSrc,
  onOpenFolder,
  onNewFile,
  onCloneRepo,
  onAiOrchestra,
  onRecent,
  onGettingStarted,
  onDocumentation,
  quickActions,
  className = ''
}) {
  // Default quick actions
  const defaultActions = [
    {
      id: 'open-folder',
      icon: FolderOpen,
      title: 'Open Folder',
      description: 'Start with an existing project',
      variant: 'primary',
      onClick: onOpenFolder
    },
    {
      id: 'new-file',
      icon: FileText,
      title: 'New File',
      description: 'Create a new file',
      variant: 'light',
      onClick: onNewFile
    },
    {
      id: 'clone-repo',
      icon: GitBranch,
      title: 'Clone Repository',
      description: 'Clone from Git',
      variant: 'dark',
      onClick: onCloneRepo
    },
    {
      id: 'ai-orchestra',
      icon: Sparkles,
      title: 'AI Orchestra',
      description: 'Start with AI agents',
      variant: 'accent',
      onClick: onAiOrchestra
    }
  ];

  const actions = quickActions || defaultActions;

  return (
    <div className={`flex-1 flex items-center justify-center p-12 ${className}`}>
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Logo */}
        <AnimatedLogo logoSrc={logoSrc} />

        {/* Welcome Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            Welcome to <span className="text-symphony-primary">Symphony</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            The AI-First Development Environment where intelligent agents orchestrate software creation
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mt-8">
          {actions.map((action) => (
            <QuickActionCard
              key={action.id}
              icon={action.icon}
              title={action.title}
              description={action.description}
              variant={action.variant}
              onClick={action.onClick}
            />
          ))}
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center space-x-6 text-sm mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRecent}
            className="text-text-secondary hover:text-symphony-primary flex items-center space-x-1 h-auto py-1"
          >
            <Clock className="w-4 h-4" />
            <span>Recent</span>
          </Button>
          
          <span className="text-text-tertiary">•</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onGettingStarted}
            className="text-text-secondary hover:text-symphony-light flex items-center space-x-1 h-auto py-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Getting Started</span>
          </Button>
          
          <span className="text-text-tertiary">•</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDocumentation}
            className="text-text-secondary hover:text-symphony-dark flex items-center space-x-1 h-auto py-1"
          >
            <BookOpen className="w-4 h-4" />
            <span>Documentation</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
