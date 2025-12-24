#!/usr/bin/env node
/**
 * CLI Binary Entry Point
 * 
 * This file serves as the executable entry point for the CLI.
 * It can be run directly with Node.js or through npx.
 * 
 * @example
 * ```bash
 * # Run directly
 * npx tsx packages/evaluation-framework/src/cli/bin.ts evaluate packages/components/tab-bar
 * 
 * # Or through npm scripts
 * pnpm --filter @symphony/evaluation-framework evaluate packages/components/tab-bar
 * ```
 */

import { main } from './index';

// Run the CLI
main(process.argv.slice(2)).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
