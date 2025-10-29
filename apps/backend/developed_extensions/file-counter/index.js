// File Counter extension for Symphony
// Demonstrates filesystem operations
const fs = require('fs');
const path = require('path');

class FileCounterExtension {
    constructor() {
        this.disposables = [];
    }

    async onActivate(context) {
        console.log('File Counter extension activated');
        
        // Register command
        const command = await context.registerCommand(
            'file-counter.countFiles',
            (uri) => this.countFiles(uri)
        );
        
        this.disposables.push(command);
        this.showMessage('File Counter is ready to use!');
    }

    async onDeactivate() {
        console.log('File Counter extension deactivated');
        this.cleanup();
    }

    cleanup() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }

    showMessage(message) {
        console.log(`[FileCounter] ${message}`);
    }

    async countFiles(uri) {
        try {
            if (!uri) {
                return { success: false, message: 'No directory selected' };
            }

            const dirPath = uri.fsPath;
            const stats = await fs.promises.stat(dirPath);
            
            if (!stats.isDirectory()) {
                return { success: false, message: 'Please select a directory' };
            }

            const files = await fs.promises.readdir(dirPath);
            const fileCount = files.length;
            
            this.showMessage(`Found ${fileCount} files in ${path.basename(dirPath)}`);
            
            return {
                success: true,
                count: fileCount,
                directory: dirPath,
                message: `Found ${fileCount} files`
            };
        } catch (error) {
            console.error('Error counting files:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to count files'
            };
        }
    }
}

module.exports = new FileCounterExtension();
