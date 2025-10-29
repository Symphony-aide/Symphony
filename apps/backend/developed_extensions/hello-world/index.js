// Simple Hello World extension for Symphony
// Demonstrates basic extension lifecycle and commands

class HelloWorldExtension {
    constructor() {
        this.outputChannel = null;
    }

    // Called when the extension is activated
    async onActivate(context) {
        console.log('Hello World extension activated!');
        
        // Register command
        const command = await context.registerCommand('hello-world.sayHello', () => this.sayHello());
        
        // Store disposables for cleanup
        this.disposables = [command];
        
        // Show welcome message
        this.showMessage('Hello World extension is now active!');
    }

    // Called when the extension is deactivated
    async onDeactivate() {
        console.log('Hello World extension deactivated');
        // Clean up resources
        if (this.disposables) {
            this.disposables.forEach(d => d.dispose());
        }
        this.showMessage('Goodbye from Hello World!');
    }

    // Show a message to the user
    showMessage(message) {
        console.log(`[HelloWorld] ${message}`);
        // In a real extension, you would use the UI API to show a notification
    }

    // Command implementation
    async sayHello() {
        this.showMessage('Hello from Symphony! 👋');
        return {
            success: true,
            message: 'Hello command executed successfully!'
        };
    }
}

// Export the extension class
module.exports = new HelloWorldExtension();
