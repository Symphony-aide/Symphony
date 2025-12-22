/**
 * Storybook stories for Progressive Feedback System components
 *
 * Demonstrates all feedback components at each escalation level with
 * interactive controls for testing different configurations.
 *
 * @module feedback/stories
 *
 * **Validates: Requirements 7.1**
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { InlineSpinner } from './components/InlineSpinner';
import { OverlaySpinner } from './components/OverlaySpinner';
import { ModalProgress } from './components/ModalProgress';
import { ErrorFeedback } from './components/ErrorFeedback';
import { TreeSkeleton } from './components/skeletons/TreeSkeleton';
import { TableSkeleton } from './components/skeletons/TableSkeleton';
import { ListSkeleton } from './components/skeletons/ListSkeleton';
import { FeedbackThemeProvider } from './FeedbackThemeContext';
import type { FeedbackTheme } from './types';

// ============================================================================
// InlineSpinner Stories
// ============================================================================

const inlineSpinnerMeta: Meta<typeof InlineSpinner> = {
  title: 'Feedback/InlineSpinner',
  component: InlineSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Subtle inline loading indicator for operations taking 200-500ms. Designed to be placed inline with text or within buttons.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'muted', 'destructive', 'success', 'warning'],
      description: 'Color variant of the spinner',
    },
    label: {
      control: 'text',
      description: 'Accessibility label for screen readers',
    },
  },
  tags: ['autodocs'],
};

export default inlineSpinnerMeta;
type InlineSpinnerStory = StoryObj<typeof InlineSpinner>;

export const InlineDefault: InlineSpinnerStory = {
  name: 'Default',
  args: {
    size: 'sm',
    color: 'default',
    label: 'Loading',
  },
};

export const InlineSizes: InlineSpinnerStory = {
  name: 'All Sizes',
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <InlineSpinner size="xs" />
        <span className="text-xs text-muted-foreground">xs</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InlineSpinner size="sm" />
        <span className="text-xs text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InlineSpinner size="md" />
        <span className="text-xs text-muted-foreground">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InlineSpinner size="lg" />
        <span className="text-xs text-muted-foreground">lg</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InlineSpinner size="xl" />
        <span className="text-xs text-muted-foreground">xl</span>
      </div>
    </div>
  ),
};

export const InlineColors: InlineSpinnerStory = {
  name: 'All Colors',
  render: () => (
    <div className="flex items-center gap-4">
      {(['default', 'primary', 'secondary', 'muted', 'destructive', 'success', 'warning'] as const).map(
        (color) => (
          <div key={color} className="flex flex-col items-center gap-2">
            <InlineSpinner size="md" color={color} />
            <span className="text-xs text-muted-foreground">{color}</span>
          </div>
        )
      )}
    </div>
  ),
};

export const InlineInButton: InlineSpinnerStory = {
  name: 'Inside Button',
  render: () => (
    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
      <InlineSpinner size="xs" color="default" className="text-primary-foreground" />
      <span>Loading...</span>
    </button>
  ),
};

export const InlineWithText: InlineSpinnerStory = {
  name: 'With Text',
  render: () => (
    <div className="flex items-center gap-2">
      <span>Processing</span>
      <InlineSpinner size="sm" color="primary" />
    </div>
  ),
};


// ============================================================================
// OverlaySpinner Stories
// ============================================================================

export const OverlayDefault: StoryObj<typeof OverlaySpinner> = {
  name: 'Overlay - Default',
  render: () => (
    <div className="relative w-64 h-48 border rounded-md bg-background">
      <div className="p-4">
        <h3 className="font-medium">Content Area</h3>
        <p className="text-sm text-muted-foreground">This content is being loaded...</p>
      </div>
      <OverlaySpinner visible={true} />
    </div>
  ),
};

export const OverlayWithMessage: StoryObj<typeof OverlaySpinner> = {
  name: 'Overlay - With Message',
  render: () => (
    <div className="relative w-64 h-48 border rounded-md bg-background">
      <div className="p-4">
        <h3 className="font-medium">Content Area</h3>
        <p className="text-sm text-muted-foreground">This content is being loaded...</p>
      </div>
      <OverlaySpinner visible={true} message="Loading data..." />
    </div>
  ),
};

export const OverlayWithProgress: StoryObj<typeof OverlaySpinner> = {
  name: 'Overlay - With Progress',
  render: () => (
    <div className="relative w-64 h-48 border rounded-md bg-background">
      <div className="p-4">
        <h3 className="font-medium">Content Area</h3>
        <p className="text-sm text-muted-foreground">This content is being loaded...</p>
      </div>
      <OverlaySpinner
        visible={true}
        progress={{ type: 'determinate', value: 65, message: 'Processing files...' }}
      />
    </div>
  ),
};

export const OverlaySizes: StoryObj<typeof OverlaySpinner> = {
  name: 'Overlay - All Sizes',
  render: () => (
    <div className="flex gap-4">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="relative w-32 h-32 border rounded-md bg-background">
          <div className="p-2 text-center text-xs text-muted-foreground">{size}</div>
          <OverlaySpinner visible={true} size={size} />
        </div>
      ))}
    </div>
  ),
};

export const OverlayColors: StoryObj<typeof OverlaySpinner> = {
  name: 'Overlay - All Colors',
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['default', 'primary', 'secondary', 'muted', 'destructive', 'success', 'warning'] as const).map(
        (color) => (
          <div key={color} className="relative w-28 h-28 border rounded-md bg-background">
            <div className="p-2 text-center text-xs text-muted-foreground">{color}</div>
            <OverlaySpinner visible={true} color={color} size="sm" />
          </div>
        )
      )}
    </div>
  ),
};


// ============================================================================
// ModalProgress Stories
// ============================================================================

export const ModalIndeterminate: StoryObj<typeof ModalProgress> = {
  name: 'Modal - Indeterminate',
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open Modal
        </button>
        <ModalProgress
          open={open}
          title="Processing"
          progress={{ type: 'indeterminate', message: 'Please wait...' }}
          onCancel={() => setOpen(false)}
          canCancel={true}
        />
      </div>
    );
  },
};

export const ModalDeterminate: StoryObj<typeof ModalProgress> = {
  name: 'Modal - Determinate Progress',
  render: () => {
    const [open, setOpen] = React.useState(true);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      if (!open) {
        setProgress(0);
        return;
      }
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }, [open]);

    return (
      <div>
        <button
          onClick={() => {
            setProgress(0);
            setOpen(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Start Upload
        </button>
        <ModalProgress
          open={open}
          title="Uploading Files"
          progress={{
            type: 'determinate',
            value: progress,
            message: `Uploading file ${Math.ceil(progress / 20)} of 5...`,
          }}
          onCancel={() => setOpen(false)}
          canCancel={true}
        />
      </div>
    );
  },
};

export const ModalNonCancellable: StoryObj<typeof ModalProgress> = {
  name: 'Modal - Non-Cancellable',
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open Modal
        </button>
        <ModalProgress
          open={open}
          title="Critical Operation"
          progress={{ type: 'indeterminate', message: 'This operation cannot be cancelled...' }}
          onCancel={() => {}}
          canCancel={false}
        />
        <button
          onClick={() => setOpen(false)}
          className="ml-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
        >
          Force Close (Demo)
        </button>
      </div>
    );
  },
};

export const ModalWithTheme: StoryObj<typeof ModalProgress> = {
  name: 'Modal - Custom Theme',
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open Themed Modal
        </button>
        <ModalProgress
          open={open}
          title="Custom Styled Progress"
          progress={{ type: 'determinate', value: 75, message: 'Almost done...' }}
          onCancel={() => setOpen(false)}
          canCancel={true}
          theme={{
            color: 'success',
            borderRadius: 'lg',
            progressBarHeight: 12,
          }}
        />
      </div>
    );
  },
};


// ============================================================================
// ErrorFeedback Stories
// ============================================================================

export const ErrorInline: StoryObj<typeof ErrorFeedback> = {
  name: 'Error - Inline',
  render: () => (
    <ErrorFeedback
      error={new Error('Failed to load data')}
      variant="inline"
      onDismiss={() => alert('Dismissed')}
      onRetry={() => alert('Retrying...')}
    />
  ),
};

export const ErrorOverlay: StoryObj<typeof ErrorFeedback> = {
  name: 'Error - Overlay',
  render: () => (
    <div className="relative w-64 h-48 border rounded-md bg-background">
      <div className="p-4">
        <h3 className="font-medium">Content Area</h3>
        <p className="text-sm text-muted-foreground">This content failed to load.</p>
      </div>
      <ErrorFeedback
        error={new Error('Network connection failed')}
        variant="overlay"
        onDismiss={() => alert('Dismissed')}
        onRetry={() => alert('Retrying...')}
      />
    </div>
  ),
};

export const ErrorModal: StoryObj<typeof ErrorFeedback> = {
  name: 'Error - Modal',
  render: () => {
    const [showError, setShowError] = React.useState(true);
    return (
      <div>
        <button
          onClick={() => setShowError(true)}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
        >
          Show Error Modal
        </button>
        {showError && (
          <ErrorFeedback
            error={new Error('The operation could not be completed due to a server error.')}
            variant="modal"
            title="Operation Failed"
            onDismiss={() => setShowError(false)}
            onRetry={() => {
              setShowError(false);
              alert('Retrying...');
            }}
          />
        )}
      </div>
    );
  },
};

export const ErrorTimeout: StoryObj<typeof ErrorFeedback> = {
  name: 'Error - Timeout',
  render: () => (
    <ErrorFeedback
      error={new Error('Request timeout: The server took too long to respond')}
      variant="modal"
      onDismiss={() => alert('Dismissed')}
      onRetry={() => alert('Retrying...')}
    />
  ),
};

export const ErrorNoRetry: StoryObj<typeof ErrorFeedback> = {
  name: 'Error - No Retry Option',
  render: () => (
    <ErrorFeedback
      error={new Error('Permission denied: You do not have access to this resource')}
      variant="modal"
      canRetry={false}
      onDismiss={() => alert('Dismissed')}
    />
  ),
};


// ============================================================================
// Skeleton Stories
// ============================================================================

export const SkeletonTree: StoryObj<typeof TreeSkeleton> = {
  name: 'Skeleton - Tree',
  render: () => (
    <div className="w-64 border rounded-md bg-background">
      <TreeSkeleton itemCount={4} maxDepth={2} showIcons />
    </div>
  ),
};

export const SkeletonTreeCustom: StoryObj<typeof TreeSkeleton> = {
  name: 'Skeleton - Tree Custom',
  render: () => (
    <div className="w-64 border rounded-md bg-background">
      <TreeSkeleton
        itemCount={6}
        maxDepth={3}
        showIcons
        theme={{ borderRadius: 'lg', animationSpeed: 'slow' }}
      />
    </div>
  ),
};

export const SkeletonTable: StoryObj<typeof TableSkeleton> = {
  name: 'Skeleton - Table',
  render: () => (
    <div className="w-full max-w-lg">
      <TableSkeleton rowCount={5} columnCount={4} showHeader showCheckbox />
    </div>
  ),
};

export const SkeletonTableSimple: StoryObj<typeof TableSkeleton> = {
  name: 'Skeleton - Table Simple',
  render: () => (
    <div className="w-full max-w-md">
      <TableSkeleton rowCount={3} columnCount={3} showHeader={false} />
    </div>
  ),
};

export const SkeletonListSimple: StoryObj<typeof ListSkeleton> = {
  name: 'Skeleton - List Simple',
  render: () => (
    <div className="w-64 border rounded-md bg-background">
      <ListSkeleton itemCount={5} layout="simple" showDividers />
    </div>
  ),
};

export const SkeletonListDetailed: StoryObj<typeof ListSkeleton> = {
  name: 'Skeleton - List Detailed',
  render: () => (
    <div className="w-72 border rounded-md bg-background">
      <ListSkeleton itemCount={4} layout="detailed" showDividers />
    </div>
  ),
};

export const SkeletonListAvatar: StoryObj<typeof ListSkeleton> = {
  name: 'Skeleton - List Avatar',
  render: () => (
    <div className="w-80 border rounded-md bg-background">
      <ListSkeleton itemCount={4} layout="avatar" showDividers />
    </div>
  ),
};

export const SkeletonAllTypes: StoryObj = {
  name: 'Skeleton - All Types',
  render: () => (
    <div className="flex flex-wrap gap-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Tree</h4>
        <div className="w-48 border rounded-md bg-background">
          <TreeSkeleton itemCount={3} maxDepth={2} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Table</h4>
        <div className="w-64">
          <TableSkeleton rowCount={3} columnCount={3} showHeader />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">List (Avatar)</h4>
        <div className="w-64 border rounded-md bg-background">
          <ListSkeleton itemCount={3} layout="avatar" />
        </div>
      </div>
    </div>
  ),
};


// ============================================================================
// Escalation Level Demo Stories
// ============================================================================

export const EscalationLevelDemo: StoryObj = {
  name: 'Escalation Levels - Interactive Demo',
  render: () => {
    const [level, setLevel] = React.useState<'none' | 'inline' | 'overlay' | 'modal'>('none');
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      if (level === 'modal') {
        const interval = setInterval(() => {
          setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
        }, 500);
        return () => clearInterval(interval);
      }
    }, [level]);

    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setLevel('none')}
            className={`px-3 py-1 rounded-md text-sm ${
              level === 'none' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            None (&lt;200ms)
          </button>
          <button
            onClick={() => setLevel('inline')}
            className={`px-3 py-1 rounded-md text-sm ${
              level === 'inline' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            Inline (200-500ms)
          </button>
          <button
            onClick={() => setLevel('overlay')}
            className={`px-3 py-1 rounded-md text-sm ${
              level === 'overlay' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            Overlay (500ms-2s)
          </button>
          <button
            onClick={() => setLevel('modal')}
            className={`px-3 py-1 rounded-md text-sm ${
              level === 'modal' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            Modal (&gt;2s)
          </button>
        </div>

        <div className="relative w-80 h-48 border rounded-md bg-background p-4">
          <h3 className="font-medium">Content Area</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This demonstrates how feedback escalates based on operation duration.
          </p>

          {level === 'inline' && (
            <div className="absolute top-4 right-4">
              <InlineSpinner size="sm" />
            </div>
          )}

          {level === 'overlay' && (
            <OverlaySpinner visible={true} message="Loading content..." />
          )}
        </div>

        {level === 'modal' && (
          <ModalProgress
            open={true}
            title="Long Running Operation"
            progress={{
              type: 'determinate',
              value: progress,
              message: 'Processing data...',
            }}
            onCancel={() => setLevel('none')}
            canCancel={true}
          />
        )}
      </div>
    );
  },
};


// ============================================================================
// Theme Customization Stories
// ============================================================================

export const ThemeCustomization: StoryObj = {
  name: 'Theme - Customization Demo',
  render: () => {
    const themes: Array<{ name: string; theme: Partial<FeedbackTheme> }> = [
      { name: 'Default', theme: {} },
      { name: 'Primary Fast', theme: { color: 'primary', animationSpeed: 'fast' } },
      { name: 'Success Slow', theme: { color: 'success', animationSpeed: 'slow' } },
      { name: 'Warning Large', theme: { color: 'warning', size: 'lg' } },
      { name: 'Destructive', theme: { color: 'destructive', borderRadius: 'full' } },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Theme Variants</h3>
        <div className="flex flex-wrap gap-4">
          {themes.map(({ name, theme }) => (
            <div key={name} className="text-center">
              <div className="relative w-24 h-24 border rounded-md bg-background mb-2">
                <OverlaySpinner visible={true} theme={theme} size="sm" />
              </div>
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const ThemeProvider: StoryObj = {
  name: 'Theme - Provider Context',
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Default Theme</h4>
        <div className="flex gap-4">
          <InlineSpinner size="md" />
          <div className="relative w-24 h-24 border rounded-md bg-background">
            <OverlaySpinner visible={true} size="sm" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Custom Theme Provider (Success + Fast)</h4>
        <FeedbackThemeProvider
          initialTheme={{ color: 'success', animationSpeed: 'fast', borderRadius: 'lg' }}
        >
          <div className="flex gap-4">
            <InlineSpinner size="md" />
            <div className="relative w-24 h-24 border rounded-md bg-background">
              <OverlaySpinner visible={true} size="sm" />
            </div>
          </div>
        </FeedbackThemeProvider>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Custom Theme Provider (Warning + Slow)</h4>
        <FeedbackThemeProvider
          initialTheme={{ color: 'warning', animationSpeed: 'slow', overlayOpacity: 80 }}
        >
          <div className="flex gap-4">
            <InlineSpinner size="md" />
            <div className="relative w-24 h-24 border rounded-md bg-background">
              <OverlaySpinner visible={true} size="sm" />
            </div>
          </div>
        </FeedbackThemeProvider>
      </div>
    </div>
  ),
};


// ============================================================================
// Real-World Usage Examples
// ============================================================================

export const RealWorldFileUpload: StoryObj = {
  name: 'Example - File Upload',
  render: () => {
    const [state, setState] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = React.useState(0);

    const startUpload = () => {
      setState('uploading');
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setState('success');
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 300);
    };

    const simulateError = () => {
      setState('uploading');
      setProgress(0);
      setTimeout(() => {
        setProgress(45);
        setTimeout(() => setState('error'), 500);
      }, 1000);
    };

    return (
      <div className="space-y-4 w-80">
        <div className="flex gap-2">
          <button
            onClick={startUpload}
            disabled={state === 'uploading'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            Upload File
          </button>
          <button
            onClick={simulateError}
            disabled={state === 'uploading'}
            className="px-4 py-2 bg-secondary rounded-md disabled:opacity-50"
          >
            Simulate Error
          </button>
        </div>

        <div className="relative border rounded-md p-4 bg-background min-h-[100px]">
          {state === 'idle' && (
            <p className="text-muted-foreground">Click upload to start</p>
          )}
          {state === 'uploading' && (
            <>
              <p className="text-sm">Uploading document.pdf...</p>
              <OverlaySpinner
                visible={true}
                progress={{ type: 'determinate', value: progress, message: 'Uploading...' }}
              />
            </>
          )}
          {state === 'success' && (
            <p className="text-green-600">✓ Upload complete!</p>
          )}
          {state === 'error' && (
            <ErrorFeedback
              error={new Error('Upload failed: Network error')}
              variant="overlay"
              onRetry={() => startUpload()}
              onDismiss={() => setState('idle')}
            />
          )}
        </div>
      </div>
    );
  },
};

export const RealWorldDataLoading: StoryObj = {
  name: 'Example - Data Loading',
  render: () => {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<string[] | null>(null);

    const loadData = () => {
      setLoading(true);
      setData(null);
      setTimeout(() => {
        setData(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
        setLoading(false);
      }, 2000);
    };

    React.useEffect(() => {
      loadData();
    }, []);

    return (
      <div className="w-64">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Data List</h4>
          <button
            onClick={loadData}
            className="text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="border rounded-md bg-background">
          {loading ? (
            <ListSkeleton itemCount={5} layout="simple" />
          ) : (
            <ul className="divide-y">
              {data?.map((item, i) => (
                <li key={i} className="px-3 py-2 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
};

export const RealWorldTreeLoading: StoryObj = {
  name: 'Example - File Tree Loading',
  render: () => {
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => setLoading(false), 2500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="w-64">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">File Explorer</h4>
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2500);
            }}
            className="text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="border rounded-md bg-background">
          {loading ? (
            <TreeSkeleton itemCount={4} maxDepth={2} showIcons />
          ) : (
            <div className="p-2 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span>📁</span> src
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span>📁</span> components
              </div>
              <div className="flex items-center gap-2 pl-8">
                <span>📄</span> Button.tsx
              </div>
              <div className="flex items-center gap-2 pl-8">
                <span>📄</span> Input.tsx
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span>📄</span> index.ts
              </div>
              <div className="flex items-center gap-2">
                <span>📄</span> package.json
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
};

