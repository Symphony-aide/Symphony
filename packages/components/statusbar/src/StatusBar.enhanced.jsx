import React from "react";
import { GitBranch, Cloud, Info } from "lucide-react";
import { Button, Separator } from "ui";

export default function StatusBar({ 
  gitBranch = "main",
  syncStatus = "synced",
  conductorReady = true,
  mode = "normal",
  encoding = "UTF-8",
  version = "v0.1.7",
  onBranchClick,
  onSyncClick,
  onModeClick,
  onEncodingClick,
  className = ''
}) {
  const modeEmoji = mode === 'maestro' ? '🎩' : '🎼';
  const modeLabel = mode === 'maestro' ? 'Maestro Mode' : 'Normal Mode';

  return (
    <footer className={`
      bg-bg-secondary border-t border-border-subtle 
      px-4 py-1.5 
      flex items-center justify-between 
      text-xs
      ${className}
    `}>
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        {/* Branch Info */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBranchClick}
          className="flex items-center space-x-1.5 hover:bg-bg-tertiary px-2 py-1 rounded text-text-secondary hover:text-text-primary h-auto"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>{gitBranch}</span>
        </Button>

        <Separator orientation="vertical" className="h-4 bg-border-subtle" />

        {/* Sync Status */}
        <button
          onClick={onSyncClick}
          className="flex items-center space-x-2 text-text-tertiary hover:text-text-primary"
        >
          <div className="flex items-center space-x-1">
            <Cloud className="w-3.5 h-3.5" />
            <span className="capitalize">{syncStatus}</span>
          </div>
        </button>

        <Separator orientation="vertical" className="h-4 bg-border-subtle" />

        {/* Conductor Status */}
        <div className="flex items-center space-x-1.5 text-text-tertiary">
          <div className={`w-1.5 h-1.5 rounded-full ${conductorReady ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span>Conductor {conductorReady ? 'Ready' : 'Offline'}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Mode Indicator */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onModeClick}
          className="px-2 py-1 rounded text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary h-auto"
        >
          <span>{modeEmoji} {modeLabel}</span>
        </Button>

        <Separator orientation="vertical" className="h-4 bg-border-subtle" />

        {/* Encoding */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEncodingClick}
          className="px-2 py-1 rounded text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary h-auto"
        >
          {encoding}
        </Button>

        <Separator orientation="vertical" className="h-4 bg-border-subtle" />

        {/* Version */}
        <div className="text-text-tertiary flex items-center space-x-1">
          <Info className="w-3.5 h-3.5" />
          <span>{version}</span>
        </div>
      </div>
    </footer>
  );
}
