# IDE Features

Symphony IDE is a modern development environment focused on performance, extensibility, and thematic creativity. This document outlines the **core IDE features** that define Symphony, excluding AI and agentic capabilities.

---

## 🧠 Code Intelligence

- **Language Server Protocol (LSP)**: Enables features like IntelliSense, diagnostics, navigation, and refactoring for any supported language.
- **Inline Documentation Tooltips**: Hover over symbols to view type hints, docstrings, and parameter info.
- **Go to Implementation/References**: Jump to interface implementations and reference usages across the project.
- **Code Folding & Symbol Tree View**: Fold code blocks and navigate large files via an outline of functions, classes, and symbols.
- **Syntax Highlighting & Language Support**: Built-in support for dozens of languages with TextMate grammars and LSP extensions.
- **EditorConfig Support**: Enforces consistent code style using `.editorconfig` across teams.

---

## 💻 Editing & Productivity

- **Multi-Cursor Editing**: Use multiple cursors to edit in parallel with `Alt+Click`, `Ctrl+D`, `Ctrl+Shift+L`, etc.
- **Command Palette**: Quick access to all commands with `Ctrl+Shift+P`.
- **Search and Replace**: Project-wide search with regex and preview features (`Ctrl+Shift+F`).
- **Bookmarks & Sticky Notes** *(Optional)*: Tag lines and leave notes for navigation and reminders.

---

## 🧰 File & Project Management

- **Sidebar & Explorer**: Navigate project files with drag-and-drop, context menus, and nesting.
- **Tabs & Status Bar**: Manage open files, track cursor position, Git branch, and diagnostics in the status bar.
- **Project-wide File Icons**: Visual indicators for file types (e.g., `.js`, `.json`, `Dockerfile`) in the file tree.
- **Multi-root Workspaces** *(Optional)*: Work with multiple folders in one workspace.
- **Project Templates/Starters**: Create new projects from predefined starter kits like React, Flask, Rust, etc.
- **Live Markdown Preview**: Real-time Markdown rendering with Mermaid and GFM support.

---

## 🔧 Configuration & Extension

- **Settings System**: Customize via GUI or JSON (`settings.json`) at user, workspace, or folder level.
- **Plugin API**: Extend functionality using TypeScript/JavaScript.
- **Commands System**: Create macros, assign key bindings, and define custom commands.
- **Package Control / Extensions Marketplace**: Browse, install, and update extensions.
- **Plugin Harmony System**: Ensure compatibility between plugins using sandboxing and conflict detection.

---

## ⚙️ Development Tools

- **Source Control (Git) Integration**: Stage, commit, diff, resolve conflicts, and sync with remote.
- **GitHub Integration**: Clone repos, review PRs, and manage issues from inside the IDE.
- **Integrated Terminal**: Run shell commands directly inside the editor with color output and shell profiles.
- **Virtual Environment Management**: Detect and switch between environments (e.g., Python venv’s, Node, Rust).

---

## 🎼 Symphony-Exclusive Thematic Features

- **Thematic UI Modes**: Toggle between musical visual themes like *Orchestra Mode*, *Soloist Mode*, etc.
- **Keyboard Chord Macros**: Map complex command sequences to musical chord-like input combinations.
- **Plugin Harmony System**: Coordinate plugin behavior like instruments in harmony to avoid crashes or feature clashes.

---

## 🏗️ Architecture

- **Multi-Process Architecture**: Isolates rendering, extension host, and editor core for performance and stability.
- **Crash Resilience**: Faults in one component don't take down the whole IDE.