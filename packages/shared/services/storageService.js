// Storage Service - Abstraction layer for data persistence

class StorageService {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async get(key) {
    return await this.adapter.get(key);
  }

  async set(key, value) {
    return await this.adapter.set(key, value);
  }

  async remove(key) {
    return await this.adapter.remove(key);
  }

  async clear() {
    return await this.adapter.clear();
  }

  // Synchronous versions for compatibility
  getSync(key) {
    return this.adapter.getSync ? this.adapter.getSync(key) : null;
  }

  setSync(key, value) {
    if (this.adapter.setSync) {
      this.adapter.setSync(key, value);
    }
  }
}

// LocalStorage adapter (for web compatibility)
class LocalStorageAdapter {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  remove(key) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }

  // Sync versions (same as async for localStorage)
  getSync(key) {
    return this.get(key);
  }

  setSync(key, value) {
    this.set(key, value);
  }
}

// File system adapter (for desktop apps)
class FileSystemAdapter {
  constructor(dataDir = null) {
    // Default data directory
    this.dataDir = dataDir || this.getDefaultDataDir();
    this.ensureDataDirSync();
  }

  getDefaultDataDir() {
    // For web environment, use a fallback
    if (typeof window !== 'undefined') {
      return './symphony-data';
    }
    
    // For Node.js/Electron environment
    try {
      const os = require('os');
      const path = require('path');
      const appName = 'Symphony';
      
      switch (process.platform) {
        case 'win32':
          return path.join(os.homedir(), 'AppData', 'Roaming', appName);
        case 'darwin':
          return path.join(os.homedir(), 'Library', 'Application Support', appName);
        default:
          return path.join(os.homedir(), '.config', appName);
      }
    } catch {
      return './symphony-data';
    }
  }

  ensureDataDirSync() {
    try {
      const fs = require('fs');
      fs.mkdirSync(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  getFilePath(key) {
    try {
      const path = require('path');
      return path.join(this.dataDir, `${key}.json`);
    } catch {
      return `${this.dataDir}/${key}.json`;
    }
  }

  async get(key) {
    try {
      const fs = await import('fs/promises');
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async set(key, value) {
    try {
      const fs = await import('fs/promises');
      this.ensureDataDirSync();
      const filePath = this.getFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }

  async remove(key) {
    try {
      const fs = await import('fs/promises');
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  async clear() {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      const path = require('path');
      await Promise.all(
        jsonFiles.map(file => fs.unlink(path.join(this.dataDir, file)))
      );
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  // Synchronous versions using require('fs')
  getSync(key) {
    try {
      const fs = require('fs');
      const filePath = this.getFilePath(key);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  setSync(key, value) {
    try {
      const fs = require('fs');
      this.ensureDataDirSync();
      const filePath = this.getFilePath(key);
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }
}

// Environment detection
const isElectron = () => {
  return typeof window !== 'undefined' && window.process && window.process.type;
};

const isNode = () => {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
};

const isBrowser = () => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

// Create appropriate adapter based on environment
const createAdapter = () => {
  if (isElectron() || isNode()) {
    return new FileSystemAdapter();
  } else if (isBrowser()) {
    return new LocalStorageAdapter();
  } else {
    // Fallback to localStorage adapter
    return new LocalStorageAdapter();
  }
};

// Export the service instance
export const storageService = new StorageService(createAdapter());

// Export adapters for testing
export { LocalStorageAdapter, FileSystemAdapter };
