// storageService.js - Storage abstraction layer
// Supports both web (localStorage) and desktop (JSON files) environments

class StorageService {
	constructor() {
		this.adapter = this.detectEnvironment();
	}

	detectEnvironment() {
		// Check if we're in a browser environment with localStorage
		if (typeof window !== 'undefined' && window.localStorage) {
			return new LocalStorageAdapter();
		}
		// For desktop app, use file system adapter
		return new FileSystemAdapter();
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

	// Synchronous methods for backward compatibility
	getSync(key) {
		return this.adapter.getSync(key);
	}

	setSync(key, value) {
		return this.adapter.setSync(key, value);
	}
}

// LocalStorage adapter for web
class LocalStorageAdapter {
	async get(key) {
		return this.getSync(key);
	}

	async set(key, value) {
		return this.setSync(key, value);
	}

	async remove(key) {
		localStorage.removeItem(key);
	}

	async clear() {
		localStorage.clear();
	}

	getSync(key) {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (error) {
			console.error(`Error reading from localStorage: ${key}`, error);
			return null;
		}
	}

	setSync(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(`Error writing to localStorage: ${key}`, error);
		}
	}
}

// FileSystem adapter for desktop (Electron/Tauri)
class FileSystemAdapter {
	constructor() {
		this.storageDir = this.getStorageDirectory();
		this.cache = new Map();
	}

	getStorageDirectory() {
		// Platform-specific storage directories
		if (typeof process !== 'undefined' && process.platform) {
			const os = process.platform;
			const home = process.env.HOME || process.env.USERPROFILE;
			
			if (os === 'win32') {
				return `${process.env.APPDATA}\\Symphony\\`;
			} else if (os === 'darwin') {
				return `${home}/Library/Application Support/Symphony/`;
			} else {
				return `${home}/.config/Symphony/`;
			}
		}
		return './symphony-data/';
	}

	async get(key) {
		return this.getSync(key);
	}

	async set(key, value) {
		return this.setSync(key, value);
	}

	async remove(key) {
		this.cache.delete(key);
		// File removal would go here
	}

	async clear() {
		this.cache.clear();
		// Directory clearing would go here
	}

	getSync(key) {
		// Return from cache if available
		if (this.cache.has(key)) {
			return this.cache.get(key);
		}
		
		// For now, fall back to localStorage if available
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				const item = localStorage.getItem(key);
				const value = item ? JSON.parse(item) : null;
				if (value) this.cache.set(key, value);
				return value;
			} catch (error) {
				console.error(`Error reading from storage: ${key}`, error);
				return null;
			}
		}
		
		return null;
	}

	setSync(key, value) {
		this.cache.set(key, value);
		
		// For now, also write to localStorage if available
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (error) {
				console.error(`Error writing to storage: ${key}`, error);
			}
		}
	}
}

export const storageService = new StorageService();
