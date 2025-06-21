#!/bin/bash

# Script to update Rust dependencies
# Run with: bash update-backend-deps.sh

echo "📦 Updating backend dependencies..."

# List all directories containing Cargo.toml files
RUST_DIRS=("core" "core_api" "core_deno" "crosspty" "desktop/src-tauri" "server" "extensions/git" "extensions/typescript-lsp" "extensions/native-shell")

# Update dependencies using cargo-edit (install if not present)
if ! command -v cargo-edit &> /dev/null; then
    echo "🔧 Installing cargo-edit..."
    cargo install cargo-edit
fi

# Loop through each directory and update dependencies
for dir in "${RUST_DIRS[@]}"; do
    if [ -f "$dir/Cargo.toml" ]; then
        echo "🔄 Updating dependencies in $dir..."
        
        # Navigate to directory
        pushd "$dir" > /dev/null
        
        # Update dependencies
        cargo upgrade --all
        
        # Return to original directory
        popd > /dev/null
        
        echo "✅ Successfully updated dependencies in $dir"
    else
        echo "⚠️ Skipping $dir, Cargo.toml not found."
    fi
done

# Update the workspace Cargo.toml
if [ -f "Cargo.toml" ]; then
    echo "🔄 Updating workspace dependencies..."
    cargo upgrade --all
    echo "✅ Successfully updated workspace dependencies"
fi

echo "🎉 Backend dependencies update completed!" 