/**
 * CLI Entry Point for the Blind Evaluation Framework
 * 
 * Provides command-line interface for evaluating Symphony IDE components
 * and generating AGREEMENT.md and SUMMARY_AGREEMENT.md files.
 * 
 * @module cli
 * 
 * Commands:
 * - evaluate <component-path>: Evaluate a single component
 * - evaluate-all: Evaluate all components in the project
 * - summary: Generate SUMMARY_AGREEMENT.md from existing AGREEMENT.md files
 * 
 * @example
 * ```bash
 * # Evaluate a single component
 * npx evaluation-framework evaluate packages/components/tab-bar
 * 
 * # Evaluate all components
 * npx evaluation-framework evaluate-all
 * 
 * # Generate summary
 * npx evaluation-framework summary
 * ```
 */

import { ComponentTraverser, type TraversalResult } from './ComponentTraverser';
import { EvaluationOrchestrator, type OrchestratorConfig } from './EvaluationOrchestrator';
import { ProgressReporter, type ProgressEvent } from './ProgressReporter';

/**
 * CLI command types
 */
export type CLICommand = 'evaluate' | 'evaluate-all' | 'summary' | 'help';

/**
 * CLI options
 */
export interface CLIOptions {
  /** Base path for the project (defaults to cwd) */
  basePath?: string;
  /** Whether to write files (false for dry-run) */
  writeFiles?: boolean;
  /** Whether to show verbose output */
  verbose?: boolean;
  /** Project name for summary */
  projectName?: string;
}

/**
 * CLI result
 */
export interface CLIResult {
  /** Whether the command succeeded */
  success: boolean;
  /** Result message */
  message: string;
  /** Any errors encountered */
  errors?: string[];
  /** Statistics about the operation */
  stats?: {
    componentsEvaluated: number;
    featuresIdentified: number;
    filesGenerated: number;
  };
}

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]): {
  command: CLICommand;
  componentPath?: string;
  options: CLIOptions;
} {
  const options: CLIOptions = {
    basePath: process.cwd(),
    writeFiles: true,
    verbose: false,
    projectName: 'Symphony IDE',
  };

  let command: CLICommand = 'help';
  let componentPath: string | undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'evaluate' && args[i + 1] && !args[i + 1].startsWith('-')) {
      command = 'evaluate';
      componentPath = args[++i];
    } else if (arg === 'evaluate-all') {
      command = 'evaluate-all';
    } else if (arg === 'summary') {
      command = 'summary';
    } else if (arg === 'help' || arg === '--help' || arg === '-h') {
      command = 'help';
    } else if (arg === '--base-path' && args[i + 1]) {
      options.basePath = args[++i];
    } else if (arg === '--dry-run') {
      options.writeFiles = false;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--project-name' && args[i + 1]) {
      options.projectName = args[++i];
    }
  }

  return { command, componentPath, options };
}

/**
 * Display help message
 */
export function showHelp(): string {
  return `
Blind Evaluation Framework CLI

Usage:
  evaluation-framework <command> [options]

Commands:
  evaluate <path>    Evaluate a single component at the specified path
  evaluate-all       Evaluate all components in the project
  summary            Generate SUMMARY_AGREEMENT.md from existing evaluations
  help               Show this help message

Options:
  --base-path <path>     Base path for the project (default: current directory)
  --dry-run              Don't write files, just show what would be done
  --verbose, -v          Show detailed progress information
  --project-name <name>  Project name for summary (default: "Symphony IDE")

Examples:
  # Evaluate a single component
  evaluation-framework evaluate packages/components/tab-bar

  # Evaluate all components with verbose output
  evaluation-framework evaluate-all --verbose

  # Generate summary without writing files
  evaluation-framework summary --dry-run
`.trim();
}

/**
 * Main CLI class
 */
export class CLI {
  private traverser: ComponentTraverser;
  private orchestrator: EvaluationOrchestrator;
  private reporter: ProgressReporter;
  private options: CLIOptions;

  constructor(options: CLIOptions = {}) {
    this.options = {
      basePath: options.basePath ?? process.cwd(),
      writeFiles: options.writeFiles ?? true,
      verbose: options.verbose ?? false,
      projectName: options.projectName ?? 'Symphony IDE',
    };

    this.traverser = new ComponentTraverser(this.options.basePath!);
    this.reporter = new ProgressReporter(this.options.verbose!);
    
    const orchestratorConfig: OrchestratorConfig = {
      basePath: this.options.basePath!,
      writeFiles: this.options.writeFiles!,
      projectName: this.options.projectName!,
      onProgress: (event: ProgressEvent) => this.reporter.report(event),
    };
    this.orchestrator = new EvaluationOrchestrator(orchestratorConfig);
  }

  /**
   * Run the CLI with the given arguments
   */
  async run(args: string[]): Promise<CLIResult> {
    const { command, componentPath, options } = parseArgs(args);
    
    // Update options if provided
    if (options.basePath) this.options.basePath = options.basePath;
    if (options.writeFiles !== undefined) this.options.writeFiles = options.writeFiles;
    if (options.verbose !== undefined) this.options.verbose = options.verbose;
    if (options.projectName) this.options.projectName = options.projectName;

    switch (command) {
      case 'evaluate':
        if (!componentPath) {
          return {
            success: false,
            message: 'Error: Component path is required for evaluate command',
            errors: ['Missing component path'],
          };
        }
        return this.evaluateSingle(componentPath);

      case 'evaluate-all':
        return this.evaluateAll();

      case 'summary':
        return this.generateSummary();

      case 'help':
      default:
        return {
          success: true,
          message: showHelp(),
        };
    }
  }

  /**
   * Evaluate a single component
   */
  async evaluateSingle(componentPath: string): Promise<CLIResult> {
    this.reporter.start(`Evaluating component: ${componentPath}`);

    try {
      const result = await this.orchestrator.evaluateComponent(componentPath);

      if (result.success) {
        this.reporter.complete(`Evaluation complete: ${result.filePath}`);
        return {
          success: true,
          message: `Successfully evaluated ${componentPath}`,
          stats: {
            componentsEvaluated: 1,
            featuresIdentified: result.featuresIdentified,
            filesGenerated: this.options.writeFiles ? 1 : 0,
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to evaluate ${componentPath}`,
          errors: [result.error || 'Unknown error'],
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error evaluating ${componentPath}`,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Evaluate all components in the project
   */
  async evaluateAll(): Promise<CLIResult> {
    this.reporter.start('Discovering components...');

    try {
      // Traverse to find all components
      const traversalResult = await this.traverser.traverse();
      const totalComponents = traversalResult.packages.length;

      this.reporter.report({
        type: 'discovery',
        message: `Found ${totalComponents} packages to evaluate`,
        total: totalComponents,
      });

      // Evaluate all components
      const result = await this.orchestrator.evaluateAll(traversalResult.packages);

      if (result.success) {
        this.reporter.complete(`Evaluation complete: ${result.componentsEvaluated} components evaluated`);
        return {
          success: true,
          message: `Successfully evaluated ${result.componentsEvaluated} components`,
          stats: {
            componentsEvaluated: result.componentsEvaluated,
            featuresIdentified: result.totalFeaturesIdentified,
            filesGenerated: this.options.writeFiles ? result.componentsEvaluated : 0,
          },
        };
      } else {
        return {
          success: false,
          message: 'Some components failed to evaluate',
          errors: result.errors,
          stats: {
            componentsEvaluated: result.componentsEvaluated,
            featuresIdentified: result.totalFeaturesIdentified,
            filesGenerated: this.options.writeFiles ? result.componentsEvaluated : 0,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error during evaluation',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Generate SUMMARY_AGREEMENT.md from existing evaluations
   */
  async generateSummary(): Promise<CLIResult> {
    this.reporter.start('Generating summary...');

    try {
      const result = await this.orchestrator.generateSummary();

      if (result.success) {
        this.reporter.complete(`Summary generated: ${result.filePath}`);
        return {
          success: true,
          message: `Successfully generated SUMMARY_AGREEMENT.md`,
          stats: {
            componentsEvaluated: result.componentsAggregated,
            featuresIdentified: result.totalFeatures,
            filesGenerated: this.options.writeFiles ? 1 : 0,
          },
        };
      } else {
        return {
          success: false,
          message: 'Failed to generate summary',
          errors: [result.error || 'Unknown error'],
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error generating summary',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

// Export all CLI components
export { ComponentTraverser, type TraversalResult } from './ComponentTraverser';
export { EvaluationOrchestrator, type OrchestratorConfig } from './EvaluationOrchestrator';
export { ProgressReporter, type ProgressEvent } from './ProgressReporter';

/**
 * Main entry point for CLI execution
 */
export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const cli = new CLI();
  const result = await cli.run(args);

  console.log(result.message);

  if (result.errors && result.errors.length > 0) {
    console.error('\nErrors:');
    result.errors.forEach(err => console.error(`  - ${err}`));
  }

  if (result.stats) {
    console.log('\nStatistics:');
    console.log(`  Components evaluated: ${result.stats.componentsEvaluated}`);
    console.log(`  Features identified: ${result.stats.featuresIdentified}`);
    console.log(`  Files generated: ${result.stats.filesGenerated}`);
  }

  process.exit(result.success ? 0 : 1);
}
