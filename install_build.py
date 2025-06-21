#!/usr/bin/env python3
"""
Robust Installation and Build Script
Installs dependencies and builds the project with comprehensive error handling
"""

import os
import sys
import subprocess
import shutil
import time
import json
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass

# Rich terminal libraries (fallback to basic if not available)
try:
    from rich.console import Console
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
    from rich.panel import Panel
    from rich.text import Text
    from rich.table import Table
    from rich.prompt import Confirm
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    print("Installing rich for better terminal experience...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "rich"], check=True, capture_output=True)
        from rich.console import Console
        from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
        from rich.panel import Panel
        from rich.text import Text
        from rich.table import Table
        from rich.prompt import Confirm
        RICH_AVAILABLE = True
    except:
        RICH_AVAILABLE = False

# Initialize console
if RICH_AVAILABLE:
    console = Console()
else:
    class BasicConsole:
        def print(self, *args, **kwargs):
            print(*args)
        def input(self, prompt):
            return input(prompt)
    console = BasicConsole()

@dataclass
class Command:
    name: str
    cmd: List[str]
    description: str
    required: bool = True
    check_cmd: Optional[List[str]] = None
    install_hint: Optional[str] = None

class InstallationManager:
    def __init__(self):
        self.failed_commands = []
        self.successful_commands = []
        self.skipped_commands = []
        self.start_time = time.time()
        
        # Define all installation commands
        self.commands = [
            Command(
                name="Node.js/pnpm Check",
                cmd=["pnpm", "--version"],
                description="Checking if pnpm is available",
                check_cmd=["pnpm", "--version"],
                install_hint="Install pnpm: npm install -g pnpm"
            ),
            Command(
                name="Rust/Cargo Check",
                cmd=["cargo", "--version"],
                description="Checking if Cargo is available",
                check_cmd=["cargo", "--version"],
                install_hint="Install Rust: https://rustup.rs/"
            ),
            Command(
                name="Frontend Dependencies",
                cmd=["pnpm", "install"],
                description="Installing frontend dependencies with pnpm"
            ),
            Command(
                name="Rust Dependencies Fetch",
                cmd=["cargo", "fetch"],
                description="Fetching Rust dependencies"
            ),
            Command(
                name="Rust Dependencies Build",
                cmd=["cargo", "build"],
                description="Building Rust dependencies"
            ),
            Command(
                name="Tauri CLI",
                cmd=["cargo", "install", "tauri-cli", "--version", "^1"],
                description="Installing Tauri CLI (latest v1.x)"
            ),
            Command(
                name="Cargo Nextest",
                cmd=["cargo", "install", "--locked", "cargo-nextest"],
                description="Installing cargo-nextest for enhanced testing"
            ),
            Command(
                name="Cargo Helper Tools",
                cmd=["cargo", "install", "cargo-edit", "cargo-watch"],
                description="Installing cargo-edit and cargo-watch utilities"
            )
        ]

    def print_header(self):
        if RICH_AVAILABLE:
            header = Panel.fit(
                "[bold blue]🚀 Project Installation & Build Script[/bold blue]\n"
                "[dim]Robust installation with comprehensive error handling[/dim]",
                border_style="blue"
            )
            console.print(header)
        else:
            print("=" * 60)
            print("🚀 PROJECT INSTALLATION & BUILD SCRIPT")
            print("Robust installation with comprehensive error handling")
            print("=" * 60)

    def check_prerequisites(self) -> bool:
        """Check if required tools are available"""
        if RICH_AVAILABLE:
            console.print("\n[bold yellow]🔍 Checking Prerequisites...[/bold yellow]")
        else:
            print("\n🔍 Checking Prerequisites...")

        prerequisites = [
            ("node", ["node", "--version"], "Node.js"),
            ("npm", ["npm", "--version"], "npm"),
            ("git", ["git", "--version"], "Git")
        ]

        missing = []
        for tool, cmd, name in prerequisites:
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    if RICH_AVAILABLE:
                        console.print(f"  ✅ {name}: [green]{result.stdout.strip()}[/green]")
                    else:
                        print(f"  ✅ {name}: {result.stdout.strip()}")
                else:
                    missing.append(name)
            except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
                missing.append(name)

        if missing:
            if RICH_AVAILABLE:
                console.print(f"\n[bold red]❌ Missing prerequisites: {', '.join(missing)}[/bold red]")
                console.print("[yellow]Please install the missing tools and run the script again.[/yellow]")
            else:
                print(f"\n❌ Missing prerequisites: {', '.join(missing)}")
                print("Please install the missing tools and run the script again.")
            return False

        return True

    def run_command(self, command: Command) -> bool:
        """Execute a single command with error handling"""
        if RICH_AVAILABLE:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
                transient=True
            ) as progress:
                task = progress.add_task(command.description, total=None)
                
                try:
                    # Check if command exists first (for tools)
                    if command.check_cmd:
                        check_result = subprocess.run(
                            command.check_cmd, 
                            capture_output=True, 
                            text=True, 
                            timeout=10
                        )
                        if check_result.returncode != 0:
                            if command.install_hint:
                                console.print(f"[yellow]⚠️  Tool not found. {command.install_hint}[/yellow]")
                            raise subprocess.CalledProcessError(check_result.returncode, command.check_cmd)

                    # Run the actual command
                    result = subprocess.run(
                        command.cmd,
                        capture_output=True,
                        text=True,
                        timeout=300,  # 5 minutes timeout
                        cwd=os.getcwd()
                    )
                    
                    progress.update(task, completed=100)
                    
                    if result.returncode == 0:
                        console.print(f"[green]✅ {command.name} completed successfully[/green]")
                        if result.stdout.strip():
                            console.print(f"[dim]   Output: {result.stdout.strip()[:100]}...[/dim]")
                        return True
                    else:
                        console.print(f"[red]❌ {command.name} failed[/red]")
                        if result.stderr:
                            console.print(f"[red]   Error: {result.stderr.strip()[:200]}...[/red]")
                        return False
                        
                except subprocess.TimeoutExpired:
                    console.print(f"[red]⏰ {command.name} timed out (5 minutes)[/red]")
                    return False
                except subprocess.CalledProcessError as e:
                    console.print(f"[red]❌ {command.name} failed with exit code {e.returncode}[/red]")
                    return False
                except FileNotFoundError:
                    console.print(f"[red]❌ Command not found for {command.name}[/red]")
                    if command.install_hint:
                        console.print(f"[yellow]💡 Hint: {command.install_hint}[/yellow]")
                    return False
                except Exception as e:
                    console.print(f"[red]❌ Unexpected error in {command.name}: {str(e)}[/red]")
                    return False
        else:
            # Fallback for basic console
            print(f"🔄 {command.description}...")
            try:
                result = subprocess.run(
                    command.cmd,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                if result.returncode == 0:
                    print(f"✅ {command.name} completed successfully")
                    return True
                else:
                    print(f"❌ {command.name} failed")
                    if result.stderr:
                        print(f"   Error: {result.stderr.strip()[:200]}")
                    return False
            except Exception as e:
                print(f"❌ Error in {command.name}: {str(e)}")
                return False

    def run_installation(self):
        """Run the complete installation process"""
        self.print_header()
        
        # Check prerequisites
        if not self.check_prerequisites():
            sys.exit(1)

        # Ask for confirmation
        if RICH_AVAILABLE:
            if not Confirm.ask("\n[bold]Continue with installation?[/bold]", default=True):
                console.print("[yellow]Installation cancelled by user.[/yellow]")
                sys.exit(0)
        else:
            response = input("\nContinue with installation? (Y/n): ").strip().lower()
            if response in ['n', 'no']:
                print("Installation cancelled by user.")
                sys.exit(0)

        # Run all commands
        if RICH_AVAILABLE:
            console.print(f"\n[bold blue]🛠️  Starting installation of {len(self.commands)} components...[/bold blue]")
        else:
            print(f"\n🛠️  Starting installation of {len(self.commands)} components...")

        for i, command in enumerate(self.commands, 1):
            if RICH_AVAILABLE:
                console.print(f"\n[bold]Step {i}/{len(self.commands)}:[/bold] {command.name}")
            else:
                print(f"\nStep {i}/{len(self.commands)}: {command.name}")

            success = self.run_command(command)
            
            if success:
                self.successful_commands.append(command.name)
            else:
                self.failed_commands.append(command.name)
                if command.required:
                    if RICH_AVAILABLE:
                        console.print(f"[red]💥 Critical failure in required component: {command.name}[/red]")
                        if not Confirm.ask("[bold red]Continue despite this failure?[/bold red]", default=False):
                            break
                    else:
                        print(f"💥 Critical failure in required component: {command.name}")
                        response = input("Continue despite this failure? (y/N): ").strip().lower()
                        if response not in ['y', 'yes']:
                            break

        self.print_summary()

    def print_summary(self):
        """Print installation summary"""
        end_time = time.time()
        duration = end_time - self.start_time

        if RICH_AVAILABLE:
            # Create summary table
            table = Table(title="Installation Summary", show_header=True, header_style="bold magenta")
            table.add_column("Status", style="bold")
            table.add_column("Count", justify="right")
            table.add_column("Components")

            if self.successful_commands:
                table.add_row("✅ Successful", str(len(self.successful_commands)), 
                            ", ".join(self.successful_commands[:3]) + 
                            (f" (+{len(self.successful_commands)-3} more)" if len(self.successful_commands) > 3 else ""))

            if self.failed_commands:
                table.add_row("❌ Failed", str(len(self.failed_commands)), 
                            ", ".join(self.failed_commands))

            if self.skipped_commands:
                table.add_row("⏭️  Skipped", str(len(self.skipped_commands)), 
                            ", ".join(self.skipped_commands))

            console.print(f"\n")
            console.print(table)
            
            # Final status
            if not self.failed_commands:
                console.print(f"\n[bold green]🎉 All installations completed successfully![/bold green]")
                console.print(f"[green]Total time: {duration:.1f} seconds[/green]")
                console.print(f"\n[bold blue]Next steps:[/bold blue]")
                console.print("• Run [bold]cargo test[/bold] to verify Rust setup")
                console.print("• Run [bold]pnpm dev[/bold] to start development server")
                console.print("• Run [bold]cargo tauri dev[/bold] to start Tauri development")
            else:
                console.print(f"\n[bold yellow]⚠️  Installation completed with {len(self.failed_commands)} failures[/bold yellow]")
                console.print(f"[yellow]Please review the failed components and install them manually if needed.[/yellow]")
                console.print(f"[dim]Total time: {duration:.1f} seconds[/dim]")
        else:
            print("\n" + "=" * 60)
            print("INSTALLATION SUMMARY")
            print("=" * 60)
            print(f"✅ Successful: {len(self.successful_commands)}")
            print(f"❌ Failed: {len(self.failed_commands)}")
            print(f"⏭️  Skipped: {len(self.skipped_commands)}")
            print(f"⏱️  Total time: {duration:.1f} seconds")
            
            if self.failed_commands:
                print(f"\nFailed components: {', '.join(self.failed_commands)}")
            
            if not self.failed_commands:
                print("\n🎉 All installations completed successfully!")
                print("\nNext steps:")
                print("• Run 'cargo test' to verify Rust setup")
                print("• Run 'pnpm dev' to start development server")
                print("• Run 'cargo tauri dev' to start Tauri development")

def main():
    """Main entry point"""
    try:
        manager = InstallationManager()
        manager.run_installation()
    except KeyboardInterrupt:
        if RICH_AVAILABLE:
            console.print("\n[yellow]Installation interrupted by user.[/yellow]")
        else:
            print("\nInstallation interrupted by user.")
        sys.exit(1)
    except Exception as e:
        if RICH_AVAILABLE:
            console.print(f"\n[red]Unexpected error: {str(e)}[/red]")
        else:
            print(f"\nUnexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()