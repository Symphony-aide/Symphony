/**
 * ComponentTraverser - Traverses Symphony's package structure to find evaluatable packages
 * 
 * Discovers all components, features, UI packages, and primitives that can be evaluated
 * by the Blind Evaluation Framework.
 * 
 * @module cli/ComponentTraverser
 * 
 * Target directories:
 * - packages/components/ (17 specialized IDE components)
 * - packages/features/src/ (21 feature packages)
 * - packages/ui/ (components, feedback)
 * - packages/primitives/src/ (core, registry, renderers, api, hooks, ipc, monitoring)
 */

/**
 * Package type classification
 */
export type PackageType = 'Component' | 'Feature Package' | 'UI' | 'Primitives';

/**
 * Represents a discovered package that can be evaluated
 */
export interface DiscoveredPackage {
  /** Name of the package */
  name: string;
  /** Full path to the package */
  path: string;
  /** Type of package */
  type: PackageType;
  /** Main source files to analyze */
  sourceFiles: string[];
  /** Whether the package has a package.json */
  hasPackageJson: boolean;
}

/**
 * Result of traversing the project structure
 */
export interface TraversalResult {
  /** All discovered packages */
  packages: DiscoveredPackage[];
  /** Total number of packages found */
  totalPackages: number;
  /** Breakdown by type */
  byType: Record<PackageType, number>;
  /** Any errors encountered during traversal */
  errors: string[];
}

/**
 * Configuration for component traversal
 */
export interface TraverserConfig {
  /** Directories to include in traversal */
  includeDirs?: string[];
  /** Patterns to exclude */
  excludePatterns?: string[];
  /** File extensions to consider as source files */
  sourceExtensions?: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<TraverserConfig> = {
  includeDirs: [
    'packages/components',
    'packages/features/src',
    'packages/ui',
    'packages/primitives/src',
  ],
  excludePatterns: [
    'node_modules',
    '__tests__',
    '__mocks__',
    '.turbo',
    'dist',
    'build',
  ],
  sourceExtensions: ['.js', '.jsx', '.ts', '.tsx'],
};

/**
 * ComponentTraverser class for discovering evaluatable packages
 * 
 * @example
 * ```typescript
 * const traverser = new ComponentTraverser('/path/to/project');
 * const result = await traverser.traverse();
 * console.log(`Found ${result.totalPackages} packages`);
 * ```
 */
export class ComponentTraverser {
  private basePath: string;
  private config: Required<TraverserConfig>;

  constructor(basePath: string, config: TraverserConfig = {}) {
    this.basePath = basePath.replace(/\\/g, '/');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Traverse the project structure and discover all evaluatable packages
   */
  async traverse(): Promise<TraversalResult> {
    const packages: DiscoveredPackage[] = [];
    const errors: string[] = [];
    const byType: Record<PackageType, number> = {
      'Component': 0,
      'Feature Package': 0,
      'UI': 0,
      'Primitives': 0,
    };

    try {
      // Traverse packages/components/
      const components = await this.traverseComponents();
      packages.push(...components);
      byType['Component'] = components.length;

      // Traverse packages/features/src/
      const features = await this.traverseFeatures();
      packages.push(...features);
      byType['Feature Package'] = features.length;

      // Traverse packages/ui/
      const ui = await this.traverseUI();
      packages.push(...ui);
      byType['UI'] = ui.length;

      // Traverse packages/primitives/src/
      const primitives = await this.traversePrimitives();
      packages.push(...primitives);
      byType['Primitives'] = primitives.length;

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      packages,
      totalPackages: packages.length,
      byType,
      errors,
    };
  }

  /**
   * Traverse packages/components/ directory
   * Expected: 17 specialized IDE components
   */
  private async traverseComponents(): Promise<DiscoveredPackage[]> {
    const componentsDir = `${this.basePath}/packages/components`;
    const packages: DiscoveredPackage[] = [];

    try {
      const fs = await import('fs/promises');
      const entries = await fs.readdir(componentsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
          const packagePath = `${componentsDir}/${entry.name}`;
          const sourceFiles = await this.findSourceFiles(packagePath);
          const hasPackageJson = await this.hasFile(packagePath, 'package.json');

          if (sourceFiles.length > 0) {
            packages.push({
              name: entry.name,
              path: packagePath,
              type: 'Component',
              sourceFiles,
              hasPackageJson,
            });
          }
        }
      }
    } catch (error) {
      // Directory might not exist, which is fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return packages;
  }

  /**
   * Traverse packages/features/src/ directory
   * Expected: 21 feature packages
   */
  private async traverseFeatures(): Promise<DiscoveredPackage[]> {
    const featuresDir = `${this.basePath}/packages/features/src`;
    const packages: DiscoveredPackage[] = [];

    try {
      const fs = await import('fs/promises');
      const entries = await fs.readdir(featuresDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
          const packagePath = `${featuresDir}/${entry.name}`;
          const sourceFiles = await this.findSourceFiles(packagePath);

          if (sourceFiles.length > 0) {
            packages.push({
              name: entry.name,
              path: packagePath,
              type: 'Feature Package',
              sourceFiles,
              hasPackageJson: false, // Feature packages are subdirectories
            });
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return packages;
  }

  /**
   * Traverse packages/ui/ directory
   * Expected: components/ and feedback/ subdirectories
   */
  private async traverseUI(): Promise<DiscoveredPackage[]> {
    const uiDir = `${this.basePath}/packages/ui`;
    const packages: DiscoveredPackage[] = [];

    try {
      const fs = await import('fs/promises');
      
      // Check for components/ subdirectory
      const componentsPath = `${uiDir}/components`;
      if (await this.directoryExists(componentsPath)) {
        const sourceFiles = await this.findSourceFiles(componentsPath);
        if (sourceFiles.length > 0) {
          packages.push({
            name: 'ui-components',
            path: componentsPath,
            type: 'UI',
            sourceFiles,
            hasPackageJson: false,
          });
        }
      }

      // Check for feedback/ subdirectory
      const feedbackPath = `${uiDir}/feedback`;
      if (await this.directoryExists(feedbackPath)) {
        const sourceFiles = await this.findSourceFiles(feedbackPath);
        if (sourceFiles.length > 0) {
          packages.push({
            name: 'ui-feedback',
            path: feedbackPath,
            type: 'UI',
            sourceFiles,
            hasPackageJson: false,
          });
        }
      }

      // Also check the root ui package
      const rootSourceFiles = await this.findSourceFilesInDir(uiDir);
      if (rootSourceFiles.length > 0) {
        packages.push({
          name: 'ui',
          path: uiDir,
          type: 'UI',
          sourceFiles: rootSourceFiles,
          hasPackageJson: await this.hasFile(uiDir, 'package.json'),
        });
      }

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return packages;
  }

  /**
   * Traverse packages/primitives/src/ directory
   * Expected: core, registry, renderers, api, hooks, ipc, monitoring
   */
  private async traversePrimitives(): Promise<DiscoveredPackage[]> {
    const primitivesDir = `${this.basePath}/packages/primitives/src`;
    const packages: DiscoveredPackage[] = [];

    const expectedSubdirs = [
      'core',
      'registry',
      'renderers',
      'api',
      'hooks',
      'ipc',
      'monitoring',
      'primitives',
      'registration',
      'utils',
    ];

    try {
      const fs = await import('fs/promises');

      for (const subdir of expectedSubdirs) {
        const subdirPath = `${primitivesDir}/${subdir}`;
        
        if (await this.directoryExists(subdirPath)) {
          const sourceFiles = await this.findSourceFiles(subdirPath);
          
          if (sourceFiles.length > 0) {
            packages.push({
              name: `primitives-${subdir}`,
              path: subdirPath,
              type: 'Primitives',
              sourceFiles,
              hasPackageJson: false,
            });
          }
        }
      }

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return packages;
  }

  /**
   * Find all source files in a package directory (recursive)
   */
  private async findSourceFiles(packagePath: string): Promise<string[]> {
    const sourceFiles: string[] = [];
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const processDir = async (dirPath: string) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            if (!this.shouldExclude(entry.name)) {
              await processDir(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (this.config.sourceExtensions.includes(ext)) {
              sourceFiles.push(fullPath);
            }
          }
        }
      };

      await processDir(packagePath);
    } catch (error) {
      // Ignore errors for missing directories
    }

    return sourceFiles;
  }

  /**
   * Find source files only in the immediate directory (non-recursive)
   */
  private async findSourceFilesInDir(dirPath: string): Promise<string[]> {
    const sourceFiles: string[] = [];

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.config.sourceExtensions.includes(ext)) {
            sourceFiles.push(path.join(dirPath, entry.name).replace(/\\/g, '/'));
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return sourceFiles;
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if a file exists in a directory
   */
  private async hasFile(dirPath: string, fileName: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      await fs.access(path.join(dirPath, fileName));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory/file should be excluded
   */
  private shouldExclude(name: string): boolean {
    return this.config.excludePatterns.some(pattern => 
      name === pattern || name.startsWith(pattern)
    );
  }

  /**
   * Get a summary of discovered packages
   */
  getSummary(result: TraversalResult): string {
    const lines: string[] = [
      `Discovered ${result.totalPackages} packages:`,
      `  - Components: ${result.byType['Component']}`,
      `  - Feature Packages: ${result.byType['Feature Package']}`,
      `  - UI: ${result.byType['UI']}`,
      `  - Primitives: ${result.byType['Primitives']}`,
    ];

    if (result.errors.length > 0) {
      lines.push('');
      lines.push('Errors:');
      result.errors.forEach(err => lines.push(`  - ${err}`));
    }

    return lines.join('\n');
  }
}
