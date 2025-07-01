export const isTauri = (globalThis as any).__TAURI__ != null;

/**
 * Launches a filesystem picker, native if Tauri and web-based on browser
 * This is a simplified version that only supports Tauri
 */
export async function openFileSystemPicker(
  filesystem_name: string,
  kind: "folder" | "file",
): Promise<string | null> {
  if (filesystem_name == "local" && isTauri) {
    const { dialog } = await import("@tauri-apps/api");

    // Make use of the native file picker if it's running in Tauri
    return (await dialog.open({
      multiple: false,
      directory: kind === "folder",
    })) as string | null;
  } else {
    // Web-based explorer not implemented in minimal version
    console.warn("Web-based file picker not implemented in minimal version");
    return null;
  }
}
