/**
 * PackageBoundaryChecker - Checks if capabilities exist as separate packages
 * 
 * Verifies whether a potential feature is actually a separate package in the
 * codebase, which should be excluded from the atomic features list.
 * 
 * @module PackageBoundaryChecker
 */

import type { PackageBoundaryCheck, ExternalDependency } from '../../types/evaluation';

/**
 * Configuration for package boundary checking
 */
export interface PackageBoundaryCheckerConfig {
  /** Root directory of the project */
  projectRoot: string;
  /** Known package directories to check */
  packageDirectories: string[];
  /** File system interface for checking paths */
  fileSystem?: FileSystemInterface;
}

/**
 * Interface for file system operations (allows mocking in tests)
 */
export interface FileSystemInterface {
  /** Check if a path exists */
  exists(path: string): boolean;
  /** Check if a path is a directory */
  isDirectory(path: string): boolean;
  /** Read package.json from a directory */
  readPackageJson(path: string): PackageJson | null;
}

/**
 * Minimal package.json structure
 */
export interface PackageJson {
  name: string;
  version?: string;
  main?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Default package directories in Symphony
 */
const DEFAULT_PACKAGE_DIRECTORIES = [
  'packages/components',
  'packages/features/src',
  'packages/ui',
  'packages/primitives/src',
  'packages/shared',
];

/**
 * In-memory file system for testing
 */
export class InMemoryFileSystem implements FileSystemInterface {
  private paths: Map<string, { isDirectory: boolean; packageJson?: PackageJson }>;

  constructor(paths: Map<string, { isDirectory: boolean; packageJson?: PackageJson }> = new Map()) {
    this.paths = paths;
  }

  exists(path: string): boolean {
    return this.paths.has(this.normalizePath(path));
  }

  isDirectory(path: string): boolean {
    const entry = this.paths.get(this.normalizePath(path));
    return entry?.isDirectory ?? false;
  }

  readPackageJson(path: string): PackageJson | null {
    const entry = this.paths.get(this.normalizePath(path));
    return entry?.packageJson ?? null;
  }

  addPath(path: string, isDirectory: boolean, packageJson?: PackageJson): void {
    this.paths.set(this.normalizePath(path), { isDirectory, packageJson });
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }
}

/**
 * PackageBoundaryChecker class for verifying package boundaries
 * 
 * @example
 * ```typescript
 * const checker = new PackageBoundaryChecker({
 *   projectRoot: '/path/to/project',
 *   packageDirectories: ['packages/components', 'packages/ui'],
 * });
 * 
 * const result = checker.checkCapability('Button', 'ui');
 * if (result.isSeparatePackage) {
 *   console.log(`${result.capability} is a separate package at ${result.packagePath}`);
 * }
 * ```
 */
export class PackageBoundaryChecker {
  private config: PackageBoundaryCheckerConfig;
  private fileSystem: FileSystemInterface;
  private knownPackages: Map<string, string>;

  constructor(config: Partial<PackageBoundaryCheckerConfig> = {}) {
    this.config = {
      projectRoot: config.projectRoot || '',
      packageDirectories: config.packageDirectories || DEFAULT_PACKAGE_DIRECTORIES,
      fileSystem: config.fileSystem,
    };
    this.fileSystem = config.fileSystem || new InMemoryFileSystem();
    this.knownPackages = new Map();
    this.initializeKnownPackages();
  }

  /**
   * Initialize the map of known packages
   */
  private initializeKnownPackages(): void {
    // Add Symphony's known packages
    const symphonyPackages = [
      // UI components
      { name: 'ui', path: 'packages/ui' },
      { name: '@symphony/ui', path: 'packages/ui' },
      
      // Component packages
      { name: 'activity-bar', path: 'packages/components/activity-bar' },
      { name: 'code-editor', path: 'packages/components/code-editor' },
      { name: 'command-palette', path: 'packages/components/command-palette' },
      { name: 'commands', path: 'packages/components/commands' },
      { name: 'file-explorer', path: 'packages/components/file-explorer' },
      { name: 'header', path: 'packages/components/header' },
      { name: 'mode-switcher', path: 'packages/components/mode-switcher' },
      { name: 'musical-background', path: 'packages/components/musical-background' },
      { name: 'notification-center', path: 'packages/components/notification-center' },
      { name: 'outlineview', path: 'packages/components/outlineview' },
      { name: 'quick-action-card', path: 'packages/components/quick-action-card' },
      { name: 'settings', path: 'packages/components/settings' },
      { name: 'statusbar', path: 'packages/components/statusbar' },
      { name: 'syntax-highlighting', path: 'packages/components/syntax-highlighting' },
      { name: 'tab-bar', path: 'packages/components/tab-bar' },
      { name: 'terminal', path: 'packages/components/terminal' },
      { name: 'welcome-screen', path: 'packages/components/welcome-screen' },
      
      // Primitives
      { name: 'primitives', path: 'packages/primitives' },
      { name: '@symphony/primitives', path: 'packages/primitives' },
      
      // Shared
      { name: 'shared', path: 'packages/shared' },
      { name: '@symphony/shared', path: 'packages/shared' },
      
      // Features
      { name: 'features', path: 'packages/features' },
      { name: '@symphony/features', path: 'packages/features' },
    ];

    for (const pkg of symphonyPackages) {
      this.knownPackages.set(pkg.name, pkg.path);
    }
  }

  /**
   * Checks if a capability exists as a separate package
   * 
   * @param capability - Name of the capability to check
   * @param importSource - The import source/path used for the capability
   * @returns Package boundary check result
   */
  checkCapability(capability: string, importSource: string): PackageBoundaryCheck {
    // Check if the import source is a known package
    if (this.knownPackages.has(importSource)) {
      return {
        capability,
        isSeparatePackage: true,
        packagePath: this.knownPackages.get(importSource),
        reason: `Import source "${importSource}" is a known Symphony package`,
      };
    }

    // Check if it's a scoped package import
    if (importSource.startsWith('@symphony/')) {
      const packageName = importSource.replace('@symphony/', '');
      const possiblePath = `packages/${packageName}`;
      
      return {
        capability,
        isSeparatePackage: true,
        packagePath: possiblePath,
        reason: `Import source "${importSource}" is a scoped Symphony package`,
      };
    }

    // Check if it's a relative import to another package
    if (importSource.startsWith('./') || importSource.startsWith('../')) {
      return {
        capability,
        isSeparatePackage: false,
        reason: `Import source "${importSource}" is a relative import within the same package`,
      };
    }

    // Check if it's an external npm package
    if (this.isExternalNpmPackage(importSource)) {
      return {
        capability,
        isSeparatePackage: true,
        reason: `Import source "${importSource}" is an external npm package`,
      };
    }

    // Check if the capability name matches a known package
    const lowerCapability = capability.toLowerCase();
    for (const [pkgName, pkgPath] of this.knownPackages) {
      if (pkgName.toLowerCase() === lowerCapability || 
          pkgName.toLowerCase().includes(lowerCapability)) {
        return {
          capability,
          isSeparatePackage: true,
          packagePath: pkgPath,
          reason: `Capability "${capability}" matches known package "${pkgName}"`,
        };
      }
    }

    // Default: not a separate package
    return {
      capability,
      isSeparatePackage: false,
      reason: `Capability "${capability}" does not match any known package`,
    };
  }

  /**
   * Checks multiple capabilities at once
   * 
   * @param capabilities - Array of capability names with their import sources
   * @returns Array of package boundary check results
   */
  checkCapabilities(
    capabilities: Array<{ name: string; importSource: string }>
  ): PackageBoundaryCheck[] {
    return capabilities.map(cap => this.checkCapability(cap.name, cap.importSource));
  }

  /**
   * Filters external dependencies to identify which are separate packages
   * 
   * @param dependencies - Array of external dependencies
   * @returns Object with separate packages and embedded capabilities
   */
  filterDependencies(dependencies: ExternalDependency[]): {
    separatePackages: ExternalDependency[];
    embeddedCapabilities: ExternalDependency[];
  } {
    const separatePackages: ExternalDependency[] = [];
    const embeddedCapabilities: ExternalDependency[] = [];

    for (const dep of dependencies) {
      const check = this.checkCapability(dep.packageName, dep.importPath);
      if (check.isSeparatePackage) {
        separatePackages.push(dep);
      } else {
        embeddedCapabilities.push(dep);
      }
    }

    return { separatePackages, embeddedCapabilities };
  }

  /**
   * Checks if an import source is an external npm package
   */
  private isExternalNpmPackage(importSource: string): boolean {
    // Common external packages
    const externalPackages = [
      'react',
      'react-dom',
      'lodash',
      'axios',
      'date-fns',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      '@radix-ui',
      'jotai',
      'monaco-editor',
      'xterm',
    ];

    // Check if it starts with any known external package
    for (const pkg of externalPackages) {
      if (importSource === pkg || importSource.startsWith(`${pkg}/`)) {
        return true;
      }
    }

    // Check if it's a scoped package (but not @symphony)
    if (importSource.startsWith('@') && !importSource.startsWith('@symphony/')) {
      return true;
    }

    // Check if it doesn't start with . or / (likely an npm package)
    if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
      // Could be an npm package - check if it looks like a package name
      const packageNamePattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
      return packageNamePattern.test(importSource);
    }

    return false;
  }

  /**
   * Adds a known package to the checker
   * 
   * @param name - Package name
   * @param path - Package path
   */
  addKnownPackage(name: string, path: string): void {
    this.knownPackages.set(name, path);
  }

  /**
   * Gets all known packages
   */
  getKnownPackages(): Map<string, string> {
    return new Map(this.knownPackages);
  }

  /**
   * Checks if a path exists in the file system
   */
  pathExists(path: string): boolean {
    return this.fileSystem.exists(path);
  }
}
