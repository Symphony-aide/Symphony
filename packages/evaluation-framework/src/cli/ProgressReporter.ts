/**
 * ProgressReporter - Reports evaluation progress during CLI execution
 * 
 * Provides visual feedback about the evaluation process including:
 * - Component being evaluated
 * - Features identified and evaluated
 * - Overall progress
 * 
 * @module cli/ProgressReporter
 */

/**
 * Types of progress events
 */
export type ProgressEventType =
  | 'start'
  | 'discovery'
  | 'component-start'
  | 'feature-identification'
  | 'features-found'
  | 'feature-evaluation'
  | 'generating'
  | 'component-complete'
  | 'progress'
  | 'complete'
  | 'error';

/**
 * Progress event data
 */
export interface ProgressEvent {
  /** Type of progress event */
  type: ProgressEventType;
  /** Human-readable message */
  message: string;
  /** Component being processed (if applicable) */
  component?: string;
  /** Current progress count */
  current?: number;
  /** Total items to process */
  total?: number;
  /** Error details (if type is 'error') */
  error?: string;
}

/**
 * Progress reporter configuration
 */
export interface ProgressReporterConfig {
  /** Whether to show verbose output */
  verbose: boolean;
  /** Custom output function (defaults to console.log) */
  output?: (message: string) => void;
  /** Whether to use colors in output */
  useColors?: boolean;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

/**
 * Status icons for different event types
 */
const ICONS = {
  start: '🚀',
  discovery: '🔍',
  'component-start': '📦',
  'feature-identification': '🔬',
  'features-found': '✨',
  'feature-evaluation': '📊',
  generating: '📝',
  'component-complete': '✅',
  progress: '⏳',
  complete: '🎉',
  error: '❌',
};

/**
 * ProgressReporter class for displaying evaluation progress
 * 
 * @example
 * ```typescript
 * const reporter = new ProgressReporter(true);
 * reporter.start('Starting evaluation...');
 * reporter.report({ type: 'progress', message: 'Processing...', current: 1, total: 10 });
 * reporter.complete('Done!');
 * ```
 */
export class ProgressReporter {
  private config: Required<ProgressReporterConfig>;
  private startTime: number = 0;
  private lastComponent: string = '';

  constructor(verbose: boolean = false, config: Partial<ProgressReporterConfig> = {}) {
    this.config = {
      verbose,
      output: config.output ?? console.log,
      useColors: config.useColors ?? this.supportsColors(),
      showTimestamps: config.showTimestamps ?? false,
    };
  }

  /**
   * Start the progress reporting
   */
  start(message: string): void {
    this.startTime = Date.now();
    this.report({
      type: 'start',
      message,
    });
  }

  /**
   * Report a progress event
   */
  report(event: ProgressEvent): void {
    const formattedMessage = this.formatEvent(event);
    
    // In non-verbose mode, only show important events
    if (!this.config.verbose && !this.isImportantEvent(event)) {
      return;
    }

    this.config.output(formattedMessage);
  }

  /**
   * Report completion
   */
  complete(message: string): void {
    const elapsed = this.getElapsedTime();
    this.report({
      type: 'complete',
      message: `${message} (${elapsed})`,
    });
  }

  /**
   * Report an error
   */
  error(message: string, error?: Error): void {
    this.report({
      type: 'error',
      message,
      error: error?.message,
    });
  }

  /**
   * Format a progress event for display
   */
  private formatEvent(event: ProgressEvent): string {
    const parts: string[] = [];

    // Add timestamp if configured
    if (this.config.showTimestamps) {
      parts.push(this.formatTimestamp());
    }

    // Add icon
    const icon = ICONS[event.type] || '•';
    parts.push(icon);

    // Add progress bar for progress events
    if (event.current !== undefined && event.total !== undefined) {
      parts.push(this.formatProgressBar(event.current, event.total));
    }

    // Add message with optional coloring
    const coloredMessage = this.colorize(event.message, event.type);
    parts.push(coloredMessage);

    // Add component name if different from last
    if (event.component && event.component !== this.lastComponent) {
      this.lastComponent = event.component;
    }

    // Add error details if present
    if (event.error) {
      parts.push(this.colorize(`\n   Error: ${event.error}`, 'error'));
    }

    return parts.join(' ');
  }

  /**
   * Format a progress bar
   */
  private formatProgressBar(current: number, total: number): string {
    const width = 20;
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage}%`;
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(): string {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    return this.config.useColors 
      ? `${COLORS.dim}[${time}]${COLORS.reset}`
      : `[${time}]`;
  }

  /**
   * Get elapsed time since start
   */
  private getElapsedTime(): string {
    const elapsed = Date.now() - this.startTime;
    
    if (elapsed < 1000) {
      return `${elapsed}ms`;
    } else if (elapsed < 60000) {
      return `${(elapsed / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.round((elapsed % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Apply color to message based on event type
   */
  private colorize(message: string, type: ProgressEventType): string {
    if (!this.config.useColors) {
      return message;
    }

    const colorMap: Record<ProgressEventType, string> = {
      start: COLORS.cyan,
      discovery: COLORS.blue,
      'component-start': COLORS.magenta,
      'feature-identification': COLORS.blue,
      'features-found': COLORS.green,
      'feature-evaluation': COLORS.yellow,
      generating: COLORS.cyan,
      'component-complete': COLORS.green,
      progress: COLORS.yellow,
      complete: COLORS.green + COLORS.bright,
      error: COLORS.red,
    };

    const color = colorMap[type] || '';
    return `${color}${message}${COLORS.reset}`;
  }

  /**
   * Check if an event is important enough to show in non-verbose mode
   */
  private isImportantEvent(event: ProgressEvent): boolean {
    const importantTypes: ProgressEventType[] = [
      'start',
      'discovery',
      'component-start',
      'component-complete',
      'complete',
      'error',
    ];
    return importantTypes.includes(event.type);
  }

  /**
   * Check if the terminal supports colors
   */
  private supportsColors(): boolean {
    // Check for common environment variables that indicate color support
    if (process.env.NO_COLOR) {
      return false;
    }
    if (process.env.FORCE_COLOR) {
      return true;
    }
    if (process.stdout && typeof process.stdout.isTTY !== 'undefined') {
      return process.stdout.isTTY;
    }
    return false;
  }

  /**
   * Create a summary of the evaluation
   */
  createSummary(stats: {
    componentsEvaluated: number;
    featuresIdentified: number;
    filesGenerated: number;
    errors: string[];
  }): string {
    const lines: string[] = [
      '',
      this.colorize('═══════════════════════════════════════', 'complete'),
      this.colorize('         Evaluation Summary', 'complete'),
      this.colorize('═══════════════════════════════════════', 'complete'),
      '',
      `  ${ICONS.complete} Components evaluated: ${stats.componentsEvaluated}`,
      `  ${ICONS['features-found']} Features identified: ${stats.featuresIdentified}`,
      `  ${ICONS.generating} Files generated: ${stats.filesGenerated}`,
    ];

    if (stats.errors.length > 0) {
      lines.push('');
      lines.push(`  ${ICONS.error} Errors: ${stats.errors.length}`);
      stats.errors.slice(0, 5).forEach(err => {
        lines.push(`     - ${err}`);
      });
      if (stats.errors.length > 5) {
        lines.push(`     ... and ${stats.errors.length - 5} more`);
      }
    }

    lines.push('');
    lines.push(this.colorize('═══════════════════════════════════════', 'complete'));

    return lines.join('\n');
  }
}

/**
 * Create a simple spinner for long-running operations
 */
export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private interval: NodeJS.Timeout | null = null;
  private message: string = '';

  /**
   * Start the spinner with a message
   */
  start(message: string): void {
    this.message = message;
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  /**
   * Update the spinner message
   */
  update(message: string): void {
    this.message = message;
  }

  /**
   * Stop the spinner with a final message
   */
  stop(message?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r' + ' '.repeat(this.message.length + 2) + '\r');
    if (message) {
      console.log(message);
    }
  }
}
