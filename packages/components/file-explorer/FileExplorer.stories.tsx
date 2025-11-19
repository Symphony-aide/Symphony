import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Mock action function for Storybook
const action = (name: string) => (...args: any[]) => {
  console.log(`${name}:`, ...args);
};

// Define types for our FileExplorer component
interface FileType {
  name: string;
  content?: string;
  size?: number;
  lastModified?: Date;
  type?: 'file' | 'folder';
}

interface GitStatusMap {
  [filePath: string]: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged';
}

interface FileExplorerProps {
  files: FileType[];
  activeFileName?: string;
  onSelectFile?: (fileName: string) => void;
  onNewFile?: () => void;
  onUploadFile?: (files: FileList) => void;
  onDeleteFile?: (fileName: string) => void;
  onRenameFile?: (oldName: string, newName: string) => void;
  onDownloadFile?: (fileName: string) => void;
  onOpenSettings?: (section: string) => void;
  modifiedTabs?: string[];
  gitStatusMap?: GitStatusMap;
  onGitStage?: (fileName: string) => void;
  onGitCommit?: (fileName: string, message: string) => void;
  onGitRevert?: (fileName: string) => void;
  onReorderFiles?: (fromIndex: number, toIndex: number) => void;
  onNewFileInFolder?: (folderPath: string) => void;
}

// Create a simplified FileExplorer that works without all dependencies
const SimpleFileExplorer: React.FC<FileExplorerProps> = ({
  files = [],
  activeFileName,
  onSelectFile,
  onNewFile,
  onUploadFile,
  onDeleteFile,
  onRenameFile,
  onDownloadFile,
  onOpenSettings,
  modifiedTabs = [],
  gitStatusMap = {},
  onGitStage,
  onGitCommit,
  onGitRevert,
  onReorderFiles,
  onNewFileInFolder
}) => {
  const [activeTab, setActiveTab] = React.useState<'files' | 'search'>('files');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [extFilter, setExtFilter] = React.useState('all');
  const [sizeFilter, setSizeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('name');
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [renamingPath, setRenamingPath] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  // Helper functions
  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext || 'none';
  };

  const getFileStatus = (fileName: string) => {
    if (modifiedTabs.includes(fileName)) return 'modified';
    return gitStatusMap[fileName] || 'clean';
  };

  const getFileIcon = (fileName: string, isFolder = false) => {
    if (isFolder) return '📁';
    const ext = getFileExtension(fileName);
    const iconMap: Record<string, string> = {
      'js': '🟨', 'jsx': '⚛️', 'ts': '🔷', 'tsx': '⚛️',
      'py': '🐍', 'css': '🎨', 'html': '🌐', 'json': '📋',
      'md': '📝', 'txt': '📄', 'png': '🖼️', 'jpg': '🖼️',
      'gif': '🖼️', 'svg': '🖼️', 'pdf': '📕'
    };
    return iconMap[ext] || '📄';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; symbol: string }> = {
      'modified': { color: '#fbbf24', symbol: 'M' },
      'added': { color: '#10b981', symbol: 'A' },
      'deleted': { color: '#ef4444', symbol: 'D' },
      'untracked': { color: '#8b5cf6', symbol: 'U' },
      'staged': { color: '#06b6d4', symbol: 'S' },
      'clean': { color: '#6b7280', symbol: '' }
    };
    const badge = statusMap[status] || statusMap.clean;
    return badge.symbol ? (
      <span 
        style={{ 
          color: badge.color, 
          fontSize: '10px', 
          fontWeight: 'bold',
          marginLeft: '4px'
        }}
      >
        {badge.symbol}
      </span>
    ) : null;
  };

  // Filter files based on current filters
  const filteredFiles = React.useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExt = extFilter === 'all' || getFileExtension(file.name) === extFilter;
      const matchesStatus = statusFilter === 'all' || getFileStatus(file.name) === statusFilter;
      
      let matchesSize = true;
      if (sizeFilter !== 'all' && file.size) {
        const sizeKB = file.size / 1024;
        switch (sizeFilter) {
          case 'small': matchesSize = sizeKB < 10; break;
          case 'medium': matchesSize = sizeKB >= 10 && sizeKB < 100; break;
          case 'large': matchesSize = sizeKB >= 100; break;
        }
      }
      
      return matchesSearch && matchesExt && matchesStatus && matchesSize;
    });
  }, [files, searchTerm, extFilter, sizeFilter, statusFilter]);

  // Sort files
  const sortedFiles = React.useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return (b.size || 0) - (a.size || 0);
        case 'modified': 
          const aTime = a.lastModified?.getTime() || 0;
          const bTime = b.lastModified?.getTime() || 0;
          return bTime - aTime;
        default: return 0;
      }
    });
  }, [filteredFiles, sortBy]);

  // Get unique extensions and statuses for filters
  const allExtensions = React.useMemo(() => {
    const exts = new Set(files.map(f => getFileExtension(f.name)));
    return Array.from(exts).filter(ext => ext !== 'none');
  }, [files]);

  const allStatuses = React.useMemo(() => {
    const statuses = new Set(files.map(f => getFileStatus(f.name)));
    return Array.from(statuses);
  }, [files, modifiedTabs, gitStatusMap]);

  const handleFileClick = (fileName: string) => {
    onSelectFile?.(fileName);
  };

  const handleRename = (fileName: string) => {
    setRenamingPath(fileName);
    setRenameValue(fileName);
  };

  const handleRenameSubmit = () => {
    if (renamingPath && renameValue && renameValue !== renamingPath) {
      onRenameFile?.(renamingPath, renameValue);
    }
    setRenamingPath(null);
    setRenameValue('');
  };

  return (
    <div style={{
      backgroundColor: '#1f2937',
      color: 'white',
      width: '256px',
      padding: '12px',
      borderRight: '1px solid #374151',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '16px' 
      }}>
        <h2 style={{ 
          fontSize: '12px', 
          letterSpacing: '0.1em', 
          color: '#d1d5db',
          margin: 0,
          fontWeight: 'normal'
        }}>
          EXPLORER
        </h2>
        <button
          onClick={() => onOpenSettings?.('shortcuts')}
          style={{
            background: 'none',
            border: 'none',
            color: '#d1d5db',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('files')}
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: activeTab === 'files' ? '#374151' : 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: activeTab === 'search' ? '#374151' : 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Search
        </button>
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        {activeTab === 'files' && (
          <>
            {/* Filter Controls */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#9ca3af' }}>
                  Extension:
                </label>
                <select
                  value={extFilter}
                  onChange={(e) => setExtFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '2px 4px',
                    backgroundColor: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  <option value="all">All</option>
                  {allExtensions.map(ext => (
                    <option key={ext} value={ext}>{ext}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#9ca3af' }}>
                  Size:
                </label>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '2px 4px',
                    backgroundColor: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  <option value="all">All</option>
                  <option value="small">Small (&lt;10KB)</option>
                  <option value="medium">Medium (10-100KB)</option>
                  <option value="large">Large (&gt;100KB)</option>
                </select>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#9ca3af' }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '2px 4px',
                    backgroundColor: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="modified">Modified</option>
                </select>
              </div>
            </div>

            {/* File Tree */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
              {sortedFiles.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#9ca3af', padding: '8px', margin: 0 }}>
                  No files match current filters
                </p>
              ) : (
                sortedFiles.map((file, index) => (
                  <div
                    key={file.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '2px',
                      backgroundColor: activeFileName === file.name ? '#3b82f6' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onClick={() => handleFileClick(file.name)}
                    onDoubleClick={() => handleRename(file.name)}
                  >
                    <span style={{ marginRight: '8px' }}>
                      {getFileIcon(file.name)}
                    </span>
                    
                    {renamingPath === file.name ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit();
                          if (e.key === 'Escape') {
                            setRenamingPath(null);
                            setRenameValue('');
                          }
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#374151',
                          color: 'white',
                          border: '1px solid #4b5563',
                          borderRadius: '2px',
                          padding: '2px 4px',
                          fontSize: '14px'
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span style={{ flex: 1 }}>{file.name}</span>
                        {getStatusBadge(getFileStatus(file.name))}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'search' && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredFiles.map(file => (
                <div
                  key={file.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    backgroundColor: activeFileName === file.name ? '#3b82f6' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onClick={() => {
                    handleFileClick(file.name);
                    setActiveTab('files');
                  }}
                >
                  <span style={{ marginRight: '8px' }}>
                    {getFileIcon(file.name)}
                  </span>
                  <span style={{ flex: 1 }}>{file.name}</span>
                  {getStatusBadge(getFileStatus(file.name))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {activeTab === 'files' && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          paddingTop: '12px',
          borderTop: '1px solid #374151'
        }}>
          <button
            onClick={() => onNewFile?.()}
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="New File"
          >
            📄 New
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) onUploadFile?.(files);
              };
              input.click();
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Upload Files"
          >
            📤 Upload
          </button>
        </div>
      )}
    </div>
  );
};

// Sample files for testing FileExplorer
const sampleFiles: FileType[] = [
  {
    name: 'App.jsx',
    size: 2048,
    lastModified: new Date('2024-01-15T10:30:00'),
    type: 'file'
  },
  {
    name: 'utils.py',
    size: 1536,
    lastModified: new Date('2024-01-14T15:45:00'),
    type: 'file'
  },
  {
    name: 'styles.css',
    size: 3072,
    lastModified: new Date('2024-01-13T09:20:00'),
    type: 'file'
  },
  {
    name: 'config.json',
    size: 512,
    lastModified: new Date('2024-01-12T14:10:00'),
    type: 'file'
  },
  {
    name: 'README.md',
    size: 1024,
    lastModified: new Date('2024-01-11T11:00:00'),
    type: 'file'
  },
  {
    name: 'package.json',
    size: 768,
    lastModified: new Date('2024-01-10T16:30:00'),
    type: 'file'
  },
  {
    name: 'main.ts',
    size: 4096,
    lastModified: new Date('2024-01-09T13:15:00'),
    type: 'file'
  },
  {
    name: 'test.spec.js',
    size: 2560,
    lastModified: new Date('2024-01-08T10:45:00'),
    type: 'file'
  },
  {
    name: 'image.png',
    size: 15360,
    lastModified: new Date('2024-01-07T12:20:00'),
    type: 'file'
  },
  {
    name: 'data.txt',
    size: 256,
    lastModified: new Date('2024-01-06T08:30:00'),
    type: 'file'
  }
];

const meta: Meta<typeof SimpleFileExplorer> = {
  title: 'Components/FileExplorer',
  component: SimpleFileExplorer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'FileExplorer - A comprehensive file management component with tree view, search, filtering, drag & drop, git integration, and context menu operations.'
      }
    }
  },
  argTypes: {
    files: {
      control: 'object',
      description: 'Array of file objects with name, size, lastModified, and type properties'
    },
    activeFileName: {
      control: 'text',
      description: 'Name of the currently active/selected file'
    },
    modifiedTabs: {
      control: 'object',
      description: 'Array of file names that have been modified but not saved'
    },
    gitStatusMap: {
      control: 'object',
      description: 'Map of file paths to their git status (modified, added, deleted, etc.)'
    },
    // Actions
    onSelectFile: { action: 'file-selected' },
    onNewFile: { action: 'new-file' },
    onUploadFile: { action: 'upload-file' },
    onDeleteFile: { action: 'delete-file' },
    onRenameFile: { action: 'rename-file' },
    onDownloadFile: { action: 'download-file' },
    onOpenSettings: { action: 'open-settings' },
    onGitStage: { action: 'git-stage' },
    onGitCommit: { action: 'git-commit' },
    onGitRevert: { action: 'git-revert' },
    onReorderFiles: { action: 'reorder-files' },
    onNewFileInFolder: { action: 'new-file-in-folder' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SimpleFileExplorer>;

export const Default: Story = {
  args: {
    files: sampleFiles.slice(0, 5),
    activeFileName: 'App.jsx',
    modifiedTabs: [],
    gitStatusMap: {},
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const WithManyFiles: Story = {
  args: {
    files: sampleFiles,
    activeFileName: 'utils.py',
    modifiedTabs: [],
    gitStatusMap: {},
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const WithModifiedFiles: Story = {
  args: {
    files: sampleFiles.slice(0, 6),
    activeFileName: 'App.jsx',
    modifiedTabs: ['App.jsx', 'utils.py', 'styles.css'],
    gitStatusMap: {},
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const WithGitStatus: Story = {
  args: {
    files: sampleFiles.slice(0, 7),
    activeFileName: 'main.ts',
    modifiedTabs: ['App.jsx'],
    gitStatusMap: {
      'App.jsx': 'modified',
      'utils.py': 'added',
      'styles.css': 'deleted',
      'config.json': 'untracked',
      'README.md': 'staged',
      'package.json': 'clean',
      'main.ts': 'modified'
    },
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
    onGitStage: action('git-stage'),
    onGitCommit: action('git-commit'),
    onGitRevert: action('git-revert'),
  },
};

export const EmptyState: Story = {
  args: {
    files: [],
    activeFileName: undefined,
    modifiedTabs: [],
    gitStatusMap: {},
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const SearchMode: Story = {
  args: {
    files: sampleFiles,
    activeFileName: 'test.spec.js',
    modifiedTabs: ['App.jsx', 'main.ts'],
    gitStatusMap: {
      'App.jsx': 'modified',
      'main.ts': 'added',
      'test.spec.js': 'untracked'
    },
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
  play: async ({ canvasElement }) => {
    // Auto-switch to search tab for demonstration
    const searchButton = canvasElement.querySelector('button:nth-child(2)') as HTMLButtonElement;
    if (searchButton) {
      searchButton.click();
    }
  },
};

export const JavaScriptFiles: Story = {
  args: {
    files: sampleFiles.filter(f => ['js', 'jsx', 'ts', 'tsx'].includes(f.name.split('.').pop() || '')),
    activeFileName: 'App.jsx',
    modifiedTabs: ['App.jsx'],
    gitStatusMap: {
      'App.jsx': 'modified',
      'test.spec.js': 'added',
      'main.ts': 'staged'
    },
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const LargeFiles: Story = {
  args: {
    files: sampleFiles.filter(f => (f.size || 0) > 2048),
    activeFileName: 'image.png',
    modifiedTabs: [],
    gitStatusMap: {
      'styles.css': 'modified',
      'main.ts': 'added',
      'image.png': 'untracked'
    },
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const RecentlyModified: Story = {
  args: {
    files: sampleFiles.slice(0, 5),
    activeFileName: 'App.jsx',
    modifiedTabs: ['App.jsx', 'utils.py'],
    gitStatusMap: {
      'App.jsx': 'modified',
      'utils.py': 'modified',
      'styles.css': 'clean'
    },
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
  },
};

export const WithAllFeatures: Story = {
  args: {
    files: sampleFiles,
    activeFileName: 'main.ts',
    modifiedTabs: ['App.jsx', 'utils.py', 'main.ts'],
    gitStatusMap: {
      'App.jsx': 'modified',
      'utils.py': 'added',
      'styles.css': 'deleted',
      'config.json': 'untracked',
      'README.md': 'staged',
      'package.json': 'clean',
      'main.ts': 'modified',
      'test.spec.js': 'added',
      'image.png': 'untracked',
      'data.txt': 'clean'
    },
    onSelectFile: action('file-selected'),
    onNewFile: action('new-file'),
    onUploadFile: action('upload-file'),
    onDeleteFile: action('delete-file'),
    onRenameFile: action('rename-file'),
    onDownloadFile: action('download-file'),
    onOpenSettings: action('open-settings'),
    onGitStage: action('git-stage'),
    onGitCommit: action('git-commit'),
    onGitRevert: action('git-revert'),
    onReorderFiles: action('reorder-files'),
    onNewFileInFolder: action('new-file-in-folder'),
  },
};
