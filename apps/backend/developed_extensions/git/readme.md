# Git Extension for Symphony

A comprehensive Git integration extension for the Symphony code editor that provides seamless version control operations directly within the editor interface.

## Features

- **🔍 Repository Detection**: Automatically detects Git repositories when navigating directories
- **🌿 Branch Information**: Displays current branch name in the status bar
- **📊 File Status Tracking**: Shows Git status for files (modified, staged, untracked, deleted, etc.)
- **⚡ Real-time Updates**: Updates Git information as you navigate through directories
- **🔄 Side Panel Integration**: Provides detailed Git status information in the side panel

## Installation

This extension is built-in to Symphony and automatically loaded when the editor starts. No additional installation is required.

## Usage

### Automatic Features

- **Status Bar**: When you open a directory containing a Git repository, the current branch name will automatically appear in the status bar
- **File Explorer**: Git status indicators will appear next to files in the file explorer

### Side Panel Integration

The extension provides detailed Git information through the side panel:

1. **File States**: View the Git status of all changed files
2. **Branch Information**: See the current branch name and repository status

## Architecture

### Core Components

- **GitExtension**: Main extension implementation that handles Git operations
- **Repository Operations**: Uses the `git2` crate for Git repository interactions
- **Message Handling**: Processes client requests for Git information
- **Status Bar Integration**: Updates the status bar with branch information

### Message Flow

```
Client Request → Extension Handler → Git Operations → Response to Client
```

## API Reference

### Public Methods

#### `get_repo_branch(path: String) -> Result<Option<String>, Error>`

Gets the current branch name for a Git repository.

**Parameters:**
- `path`: File system path to check for a Git repository

**Returns:**
- `Ok(Some(branch_name))`: Repository found with current branch
- `Ok(None)`: Repository found but no current branch
- `Err(error)`: Operation failed

#### `get_repo_status(path: String) -> Result<Vec<FileState>, Error>`

Gets the Git status for all files in a repository.

**Parameters:**
- `path`: File system path within a Git repository

**Returns:**
- `Ok(files)`: Vector of file states with Git status information
- `Err(error)`: Operation failed

### Message Types

#### ToExtension Messages

- `LoadFilesStates { path }`: Request file status information for a repository
- `LoadBranch { path }`: Request branch information for a repository

#### FromExtension Messages

- `FilesState { path, files_states }`: Response with file status information
- `Branch { path, name }`: Response with branch information
- `RepoNotFound { path }`: Repository not found at the specified path

## Development

### Building

The extension is built as part of the Symphony workspace:

```bash
cargo build --package git-for-symphony
```

### Testing

Run the extension tests:

```bash
cargo test --package git-for-symphony
```

### Dependencies

- `git2`: Git repository operations
- `serde`: Serialization for message passing
- `sveditor-core-api`: Symphony core API integration

## Contributing

When contributing to this extension:

1. Ensure all public functions have comprehensive documentation
2. Add tests for new functionality
3. Follow the existing code style and patterns
4. Update this README if adding new features

## License

This extension is part of the Symphony project and is licensed under the MIT License.
