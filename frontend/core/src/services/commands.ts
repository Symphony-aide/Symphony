export const isTauri = (globalThis as any).__TAURI__ != null;

/**
 * Launches a filesystem picker, native if Tauri and web-based on browser
 * This is a simplified version that only supports Tauri
 */
