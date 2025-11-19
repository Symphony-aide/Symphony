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

// Export the service instance
export const storageService = new StorageService(new LocalStorageAdapter());
