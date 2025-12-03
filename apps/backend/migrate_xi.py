#!/usr/bin/env python3
"""
Symphony Backend Migration Script
Migrates XI-editor core packages into Symphony's backend structure
"""

import os
import shutil
import re
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.tree import Tree
from rich import print as rprint
from rich.syntax import Syntax

# Initialize Rich console
console = Console()

# Configuration
BACKEND_ROOT = Path(__file__).parent
XI_CORE_ROOT = BACKEND_ROOT / "xi-core"
XI_RUST_ROOT = XI_CORE_ROOT / "rust"

# Packages to migrate from XI-editor
PACKAGES_TO_MIGRATE = {
    "core-lib": ("crates/core/xi-core-lib", "Core editing engine with rope data structure"),
    "rope": ("crates/utils/xi-rope", "Efficient text manipulation data structure"),
    "rpc": ("crates/core/xi-rpc", "JSON-RPC communication protocol"),
    "plugin-lib": ("crates/plugins/xi-plugin-lib", "Plugin system infrastructure"),
    "lsp-lib": ("crates/core/xi-lsp-lib", "Language Server Protocol support"),
    "unicode": ("crates/utils/xi-unicode", "Unicode handling utilities"),
    "trace": ("crates/utils/xi-trace", "Logging and tracing"),
    "syntect-plugin": ("crates/plugins/xi-syntect-plugin", "Syntax highlighting via TextMate grammars"),
}

# Directories to keep (experimental and python)
DIRS_TO_KEEP = [
    "xi-core/rust/experimental",
    "xi-core/python",
]

# Directories to delete (documentation only)
DIRS_TO_DELETE = [
    "xi-core/docs",
    "xi-core/rfcs",
    "xi-core/icons",
    "xi-core/doc",
    "xi-core/rust/sample-plugin",
    "xi-core/rust/src",
]

# Files to delete from xi-core root
FILES_TO_DELETE = [
    "xi-core/rust/BUILD.gn",
    "xi-core/rust/run_all_checks",
]

def create_crates_directory():
    """Create the crates directory structure"""
    console.print("\n[bold cyan]📁 Creating Directory Structure[/bold cyan]")
    
    crates_dir = BACKEND_ROOT / "crates"
    dirs_created = []
    
    for subdir in ["core", "plugins", "utils"]:
        path = crates_dir / subdir
        path.mkdir(parents=True, exist_ok=True)
        dirs_created.append(f"crates/{subdir}/")
    
    # Create tree visualization
    tree = Tree("📦 [bold]crates/[/bold]")
    tree.add("🔧 [cyan]core/[/cyan] - Core editing and RPC")
    tree.add("🔌 [magenta]plugins/[/magenta] - Plugin system")
    tree.add("🛠️  [yellow]utils/[/yellow] - Utilities")
    
    console.print(tree)
    console.print(f"[green]✓[/green] Created {len(dirs_created)} directories\n")
    
    return crates_dir

def move_packages(crates_dir):
    """Move XI packages to Symphony structure"""
    console.print("[bold cyan]📦 Migrating XI-editor Packages[/bold cyan]\n")
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Package", style="cyan", width=20)
    table.add_column("Destination", style="yellow", width=35)
    table.add_column("Status", width=10)
    
    package_mapping = {}
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        console=console,
    ) as progress:
        
        task = progress.add_task("[cyan]Moving packages...", total=len(PACKAGES_TO_MIGRATE))
        
        for src_name, (dest_path, description) in PACKAGES_TO_MIGRATE.items():
            src = XI_RUST_ROOT / src_name
            dest = BACKEND_ROOT / dest_path
            
            if src.exists():
                # Create parent directory if needed
                dest.parent.mkdir(parents=True, exist_ok=True)
                
                # Move the package
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(src, dest)
                
                package_mapping[src_name] = dest_path
                table.add_row(src_name, dest_path, "[green]✓ Moved[/green]")
            else:
                table.add_row(src_name, dest_path, "[red]✗ Missing[/red]")
            
            progress.update(task, advance=1)
    
    console.print(table)
    console.print(f"\n[green]✓[/green] Migrated {len(package_mapping)} packages\n")
    
    return package_mapping

def update_cargo_toml(package_mapping):
    """Update Cargo.toml files with new paths and names"""
    console.print("[bold cyan]⚙️  Updating Cargo.toml Files[/bold cyan]\n")
    
    # Update root Cargo.toml
    root_cargo = BACKEND_ROOT / "Cargo.toml"
    
    members = []
    for dest_path in package_mapping.values():
        members.append(f'    "{dest_path}",')
    
    cargo_content = f"""[workspace]
resolver = "2"
members = [
{chr(10).join(members)}
]

[workspace.package]
version = "0.1.0"
edition = "2021"
license = "Apache-2.0"
repository = "https://github.com/yourusername/symphony"

[workspace.dependencies]
# Async runtime
tokio = {{ version = "1.35", features = ["full"] }}
async-trait = "0.1"

# Serialization
serde = {{ version = "1.0", features = ["derive"] }}
serde_json = "1.0"

# Logging
log = "0.4"
tracing = "0.1"
tracing-subscriber = "0.3"

# Error handling
anyhow = "1.0"
thiserror = "1.0"

[workspace.lints.clippy]
needless_return = "allow"

[workspace.lints.rust]
unexpected_cfgs = "warn"

[profile.release]
lto = true
opt-level = "z"

[profile.dev]
opt-level = 0

[profile.dev.package."*"]
opt-level = 2
"""
    
    with open(root_cargo, 'w', encoding='utf-8') as f:
        f.write(cargo_content)
    
    console.print("[green]✓[/green] Updated root Cargo.toml")
    
    # Update individual package Cargo.toml files
    updated_count = 0
    for dest_path in package_mapping.values():
        cargo_file = BACKEND_ROOT / dest_path / "Cargo.toml"
        if cargo_file.exists():
            update_package_cargo_toml(cargo_file, dest_path)
            updated_count += 1
    
    console.print(f"[green]✓[/green] Updated {updated_count} package Cargo.toml files\n")

def update_package_cargo_toml(cargo_file, package_path):
    """Update individual package Cargo.toml"""
    with open(cargo_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update edition to 2021
    content = re.sub(r"edition\s*=\s*['\"]2018['\"]", "edition = '2021'", content)
    
    # Remove workspace section (now in root)
    content = re.sub(r'\[workspace\].*?(?=\n\[|\Z)', '', content, flags=re.DOTALL)
    
    # Update path dependencies to use workspace paths
    path_deps = {
        "../trace": "../../utils/xi-trace",
        "../rope": "../../utils/xi-rope",
        "../unicode": "../../utils/xi-unicode",
        "../rpc": "../../core/xi-rpc",
        "../core-lib": "../../core/xi-core-lib",
        "../plugin-lib": "../../plugins/xi-plugin-lib",
    }
    
    for old_path, new_path in path_deps.items():
        content = content.replace(f'path = "{old_path}"', f'path = "{new_path}"')
    
    # Remove patch.crates-io section (move to root if needed)
    content = re.sub(r'\[patch\.crates-io\].*?(?=\n\[|\Z)', '', content, flags=re.DOTALL)
    
    with open(cargo_file, 'w', encoding='utf-8') as f:
        f.write(content)

def cleanup_xi_directories():
    """Remove unnecessary XI-editor directories and files"""
    console.print("[bold cyan]🧹 Cleaning Up Unnecessary Files[/bold cyan]\n")
    
    deleted_items = []
    
    # Delete directories
    for dir_path in DIRS_TO_DELETE:
        full_path = BACKEND_ROOT / dir_path
        if full_path.exists():
            shutil.rmtree(full_path)
            deleted_items.append(("📁", dir_path))
    
    # Delete files
    for file_path in FILES_TO_DELETE:
        full_path = BACKEND_ROOT / file_path
        if full_path.exists():
            full_path.unlink()
            deleted_items.append(("📄", file_path))
    
    if deleted_items:
        for icon, item in deleted_items:
            console.print(f"  {icon} [dim]{item}[/dim]")
        console.print(f"\n[green]✓[/green] Cleaned up {len(deleted_items)} items\n")
    else:
        console.print("[yellow]ℹ[/yellow] No items to clean up\n")

def create_symphony_main():
    """Create Symphony's main entry point"""
    console.print("[bold cyan]🎵 Creating Symphony Entry Point[/bold cyan]\n")
    
    src_dir = BACKEND_ROOT / "src"
    src_dir.mkdir(exist_ok=True)
    
    main_rs = src_dir / "main.rs"
    main_content = """//! Symphony Backend
//! 
//! AI-first development environment built on XI-editor core

use std::io;

fn main() {
    // Initialize logging
    env_logger::init();
    
    println!("🎵 Symphony Backend v0.1.0");
    println!("Built on XI-editor core");
    
    // TODO: Initialize Symphony orchestration system
    // TODO: Start JSON-RPC server
    // TODO: Load extensions
    
    if let Err(e) = run() {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}

fn run() -> io::Result<()> {
    // Main application logic will go here
    Ok(())
}
"""
    
    with open(main_rs, 'w', encoding='utf-8') as f:
        f.write(main_content)
    
    console.print("[green]✓[/green] Created src/main.rs\n")

def create_readme():
    """Create README for backend"""
    console.print("[bold cyan]📝 Creating Documentation[/bold cyan]\n")
    
    readme = BACKEND_ROOT / "README.md"
    readme_content = """# Symphony Backend

Symphony's Rust backend built on XI-editor core.

## Architecture

Symphony uses a dual ensemble architecture (DEA):
- **Rust Backend**: High-performance core built on XI-editor
- **Python Conductor**: AI orchestration and reinforcement learning

## Structure

```
apps/backend/
├── crates/
│   ├── core/           # Core editing and RPC
│   │   ├── xi-core-lib/
│   │   ├── xi-rpc/
│   │   └── xi-lsp-lib/
│   ├── plugins/        # Plugin system
│   │   ├── xi-plugin-lib/
│   │   └── xi-syntect-plugin/
│   └── utils/          # Utilities
│       ├── xi-rope/
│       ├── xi-unicode/
│       └── xi-trace/
├── xi-core/
│   ├── python/         # Python bindings
│   └── rust/experimental/  # Experimental features
├── src/                # Symphony main entry point
└── Cargo.toml          # Workspace configuration
```

## Building

```bash
# Build all packages
cargo build

# Build release
cargo build --release

# Run tests
cargo test

# Run Symphony
cargo run
```

## XI-editor Integration

Symphony builds upon [XI-editor](https://github.com/xi-editor/xi-editor)'s excellent foundation:
- **Rope data structure**: Efficient text manipulation
- **JSON-RPC**: Communication protocol
- **Plugin system**: Extensible architecture
- **LSP support**: Language server integration
- **Async-first design**: Non-blocking operations

## License

Apache-2.0
"""
    
    with open(readme, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    console.print("[green]✓[/green] Created README.md\n")

def create_symphony_cargo_toml():
    """Create main Symphony binary Cargo.toml"""
    console.print("[bold cyan]🔧 Creating Symphony Binary Package[/bold cyan]\n")
    
    cargo_toml = BACKEND_ROOT / "Cargo.toml"
    
    # We'll append the binary package to the workspace
    binary_cargo = """
# Symphony main binary
[package]
name = "symphony"
version.workspace = true
edition.workspace = true
license.workspace = true
repository.workspace = true

[dependencies]
xi-core-lib = { path = "crates/core/xi-core-lib" }
xi-rpc = { path = "crates/core/xi-rpc" }
xi-rope = { path = "crates/utils/xi-rope" }

serde.workspace = true
serde_json.workspace = true
log.workspace = true
tokio.workspace = true
anyhow.workspace = true

env_logger = "0.11"

[[bin]]
name = "symphony"
path = "src/main.rs"
"""
    
    # Read existing content
    with open(cargo_toml, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Append binary package
    with open(cargo_toml, 'w', encoding='utf-8') as f:
        f.write(content + "\n" + binary_cargo)
    
    console.print("[green]✓[/green] Updated Cargo.toml with Symphony binary\n")

def print_summary(package_mapping):
    """Print migration summary"""
    console.print("\n")
    
    # Create summary panel
    summary = f"""[bold green]✅ Migration Completed Successfully![/bold green]

[bold]What was done:[/bold]
  • Moved {len(package_mapping)} XI-editor packages to crates/
  • Updated all Cargo.toml files (Rust 2018 → 2021)
  • Created Symphony main entry point (src/main.rs)
  • Organized packages into core/plugins/utils
  • Created workspace configuration
  • [yellow]Kept experimental/ and python/ directories[/yellow]

[bold]Next steps:[/bold]
  1. Review the changes
  2. Run: [cyan]cargo build[/cyan]
  3. Run: [cyan]cargo test[/cyan]
  4. Run: [cyan]cargo run[/cyan] to test Symphony

[bold yellow]Note:[/bold yellow] The xi-core/ directory still contains:
  • python/ - Python bindings (kept for future use)
  • rust/experimental/ - Experimental features (kept)
"""
    
    panel = Panel(
        summary,
        title="🎵 [bold]Symphony Backend Migration[/bold]",
        border_style="green",
        padding=(1, 2)
    )
    
    console.print(panel)

def main():
    """Main migration function"""
    # Print header
    console.print("\n")
    console.print(Panel.fit(
        "[bold cyan]Symphony Backend Migration[/bold cyan]\n"
        f"Backend Root: [yellow]{BACKEND_ROOT}[/yellow]\n"
        f"XI-Core Root: [yellow]{XI_CORE_ROOT}[/yellow]",
        border_style="cyan"
    ))
    
    try:
        # Step 1: Create directory structure
        crates_dir = create_crates_directory()
        
        # Step 2: Move packages
        package_mapping = move_packages(crates_dir)
        
        # Step 3: Update Cargo.toml files
        update_cargo_toml(package_mapping)
        
        # Step 4: Create Symphony entry point
        create_symphony_main()
        
        # Step 5: Create Symphony binary package
        create_symphony_cargo_toml()
        
        # Step 6: Create documentation
        create_readme()
        
        # Step 7: Cleanup (keeping experimental and python)
        cleanup_xi_directories()
        
        # Step 8: Print summary
        print_summary(package_mapping)
        
    except Exception as e:
        console.print(f"\n[bold red]❌ Error during migration:[/bold red] {e}")
        console.print_exception()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
