# Implementation Details

# Option 1: Dynamic Import with CDN Fallback

```tsx
// lib/dynamic-loader.ts
interface LibraryConfig {
  name: string;
  version: string;
  cdnUrl: string;
  npmPackage: string;
  globalName?: string;
}

class DynamicLibraryLoader {
  private loadedLibraries = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  async loadLibrary(config: LibraryConfig): Promise<any> {
    if (this.loadedLibraries.has(config.name)) {
      return this.loadedLibraries.get(config.name);
    }

    if (this.loadingPromises.has(config.name)) {
      return this.loadingPromises.get(config.name);
    }

    const loadPromise = this.attemptLoad(config);
    this.loadingPromises.set(config.name, loadPromise);

    try {
      const library = await loadPromise;
      this.loadedLibraries.set(config.name, library);
      this.loadingPromises.delete(config.name);
      return library;
    } catch (error) {
      this.loadingPromises.delete(config.name);
      throw error;
    }
  }

  private async attemptLoad(config: LibraryConfig): Promise<any> {
    // Try dynamic import first (if bundled as async chunk)
    try {
      const module = await import(/* webpackChunkName: "[request]" */ config.npmPackage);
      return module.default || module;
    } catch (localError) {
      console.warn(`Local import failed for ${config.name}, trying CDN...`);

      // Fallback to CDN loading
      return this.loadFromCdn(config);
    }
  }

  private async loadFromCdn(config: LibraryConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = config.cdnUrl;
      script.onload = () => {
        const library = config.globalName ? (window as any)[config.globalName] : null;
        if (library) {
          resolve(library);
        } else {
          reject(new Error(`Library ${config.name} not found on global scope`));
        }
      };
      script.onerror = () => reject(new Error(`Failed to load ${config.name} from CDN`));
      document.head.appendChild(script);
    });
  }
}

export const libraryLoader = new DynamicLibraryLoader();

// Configuration for Recharts
export const RECHARTS_CONFIG: LibraryConfig = {
  name: 'recharts',
  version: '2.8.0',
  cdnUrl: '<https://unpkg.com/recharts@2.8.0/umd/Recharts.js>',
  npmPackage: 'recharts',
  globalName: 'Recharts'
};

```

## Option 2: Plugin-Based System with Hot Installation

```tsx
// lib/plugin-system.ts
import { invoke } from '@tauri-apps/api/tauri';

interface PluginManifest {
  name: string;
  version: string;
  dependencies: string[];
  entryPoint: string;
}

class PluginManager {
  private installedPlugins = new Map<string, any>();
  private installationCache = new Map<string, Promise<any>>();

  async ensurePluginAvailable(pluginName: string): Promise<any> {
    if (this.installedPlugins.has(pluginName)) {
      return this.installedPlugins.get(pluginName);
    }

    if (this.installationCache.has(pluginName)) {
      return this.installationCache.get(pluginName);
    }

    const installPromise = this.installPlugin(pluginName);
    this.installationCache.set(pluginName, installPromise);

    try {
      const plugin = await installPromise;
      this.installedPlugins.set(pluginName, plugin);
      this.installationCache.delete(pluginName);
      return plugin;
    } catch (error) {
      this.installationCache.delete(pluginName);
      throw error;
    }
  }

  private async installPlugin(pluginName: string): Promise<any> {
    try {
      // First check if we have a cached version
      const cachedPlugin = await this.loadCachedPlugin(pluginName);
      if (cachedPlugin) return cachedPlugin;

      // Install via Tauri backend
      const manifest: PluginManifest = await invoke('install_frontend_plugin', {
        pluginName,
        version: 'latest'
      });

      // Load the installed plugin
      const pluginCode = await invoke('get_plugin_code', {
        pluginName: manifest.name,
        entryPoint: manifest.entryPoint
      });

      // Create and execute the plugin module
      const plugin = this.createPluginModule(pluginCode, manifest);

      // Cache for future use
      await this.cachePlugin(pluginName, plugin);

      return plugin;
    } catch (error) {
      console.error(`Failed to install plugin ${pluginName}:`, error);
      throw error;
    }
  }

  private async loadCachedPlugin(pluginName: string): Promise<any | null> {
    try {
      const cached = await invoke('get_cached_plugin', { pluginName });
      return cached ? this.createPluginModule(cached.code, cached.manifest) : null;
    } catch {
      return null;
    }
  }

  private createPluginModule(code: string, manifest: PluginManifest): any {
    // Create isolated execution context
    const moduleScope = {
      exports: {},
      module: { exports: {} },
      require: (dep: string) => this.resolvePluginDependency(dep),
    };

    // Execute plugin code in controlled environment
    const func = new Function('exports', 'module', 'require', code);
    func(moduleScope.exports, moduleScope.module, moduleScope.require);

    return moduleScope.module.exports || moduleScope.exports;
  }

  private async cachePlugin(pluginName: string, plugin: any): Promise<void> {
    await invoke('cache_plugin', {
      pluginName,
      plugin: JSON.stringify(plugin)
    });
  }

  private resolvePluginDependency(dep: string): any {
    // Resolve common dependencies
    const commonDeps: Record<string, any> = {
      'react': React,
      'react-dom': ReactDOM,
      // Add other common dependencies
    };

    return commonDeps[dep] || null;
  }
}

export const pluginManager = new PluginManager();

```

## Option 3: Rust-Side Package Management Integration

```rust
// src-tauri/src/plugin_manager.rs
use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendPlugin {
    pub name: String,
    pub version: String,
    pub entry_point: String,
    pub dependencies: Vec<String>,
    pub install_path: PathBuf,
}

pub struct PluginManager {
    plugins_dir: PathBuf,
    installed_plugins: HashMap<String, FrontendPlugin>,
}

impl PluginManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let plugins_dir = app_data_dir.join("frontend_plugins");
        std::fs::create_dir_all(&plugins_dir).ok();

        Self {
            plugins_dir,
            installed_plugins: HashMap::new(),
        }
    }

    pub async fn ensure_plugin_installed(&mut self, plugin_name: &str) -> Result<&FrontendPlugin, PluginError> {
        if let Some(plugin) = self.installed_plugins.get(plugin_name) {
            return Ok(plugin);
        }

        self.install_plugin(plugin_name).await?;
        Ok(self.installed_plugins.get(plugin_name).unwrap())
    }

    async fn install_plugin(&mut self, plugin_name: &str) -> Result<(), PluginError> {
        let plugin_dir = self.plugins_dir.join(plugin_name);
        std::fs::create_dir_all(&plugin_dir)?;

        // Use npm/yarn to install the package
        let output = Command::new("npm")
            .args(&["install", plugin_name, "--prefix", plugin_dir.to_str().unwrap()])
            .output()
            .await?;

        if !output.status.success() {
            return Err(PluginError::InstallationFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        // Read package.json to get plugin info
        let package_json_path = plugin_dir.join("node_modules").join(plugin_name).join("package.json");
        let package_info: PackageJson = serde_json::from_str(&std::fs::read_to_string(package_json_path)?)?;

        let plugin = FrontendPlugin {
            name: plugin_name.to_string(),
            version: package_info.version,
            entry_point: package_info.main.unwrap_or("index.js".to_string()),
            dependencies: package_info.dependencies.keys().cloned().collect(),
            install_path: plugin_dir,
        };

        self.installed_plugins.insert(plugin_name.to_string(), plugin);
        self.save_plugin_registry()?;

        Ok(())
    }

    pub async fn get_plugin_code(&self, plugin_name: &str) -> Result<String, PluginError> {
        let plugin = self.installed_plugins.get(plugin_name)
            .ok_or_else(|| PluginError::PluginNotFound(plugin_name.to_string()))?;

        let entry_path = plugin.install_path
            .join("node_modules")
            .join(&plugin.name)
            .join(&plugin.entry_point);

        let code = std::fs::read_to_string(entry_path)?;
        Ok(code)
    }

    fn save_plugin_registry(&self) -> Result<(), PluginError> {
        let registry_path = self.plugins_dir.join("registry.json");
        let registry_data = serde_json::to_string_pretty(&self.installed_plugins)?;
        std::fs::write(registry_path, registry_data)?;
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct PackageJson {
    pub version: String,
    pub main: Option<String>,
    pub dependencies: HashMap<String, String>,
}

#[derive(Debug, thiserror::Error)]
pub enum PluginError {
    #[error("Plugin {0} not found")]
    PluginNotFound(String),
    #[error("Installation failed: {0}")]
    InstallationFailed(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

// Tauri commands
#[tauri::command]
pub async fn install_frontend_plugin(
    plugin_name: String,
    state: tauri::State<'_, tokio::sync::Mutex<PluginManager>>,
) -> Result<FrontendPlugin, String> {
    let mut manager = state.lock().await;
    let plugin = manager.ensure_plugin_installed(&plugin_name).await
        .map_err(|e| e.to_string())?;
    Ok(plugin.clone())
}

#[tauri::command]
pub async fn get_plugin_code(
    plugin_name: String,
    state: tauri::State<'_, tokio::sync::Mutex<PluginManager>>,
) -> Result<String, String> {
    let manager = state.lock().await;
    manager.get_plugin_code(&plugin_name).await
        .map_err(|e| e.to_string())
}

```

## Option 4: Enhanced VirtualNode with Lazy Loading

```tsx
// Extend your VirtualNode system to support lazy components
interface LazyComponentType {
  type: 'lazy';
  componentName: string;
  libraryName: string;
  fallbackComponent?: ComponentType;
  loadingComponent?: ComponentType;
}

// Enhanced VirtualNode renderer with dynamic loading
function VirtualNodeRenderer({ node, onEvent }: { node: VirtualNode; onEvent: (event: UIEvent) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [LazyComponent, setLazyComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (node.component_type.type === 'lazy') {
      loadLazyComponent(node.component_type as LazyComponentType);
    }
  }, [node.component_type]);

  const loadLazyComponent = async (lazyType: LazyComponentType) => {
    if (LazyComponent) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      // Load the required library
      let library;
      switch (lazyType.libraryName) {
        case 'recharts':
          library = await libraryLoader.loadLibrary(RECHARTS_CONFIG);
          break;
        default:
          library = await pluginManager.ensurePluginAvailable(lazyType.libraryName);
      }

      // Get the specific component
      const Component = library[lazyType.componentName];
      if (!Component) {
        throw new Error(`Component ${lazyType.componentName} not found in ${lazyType.libraryName}`);
      }

      setLazyComponent(() => Component);
    } catch (error) {
      setLoadError(`Failed to load ${lazyType.componentName}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle lazy component rendering
  if (node.component_type.type === 'lazy') {
    if (isLoading) {
      return <div>Loading {node.component_type.componentName}...</div>;
    }

    if (loadError) {
      return <div>Error: {loadError}</div>;
    }

    if (LazyComponent) {
      return (
        <LazyComponent {...node.props}>
          {node.children.map(child => (
            <VirtualNodeRenderer key={child.id} node={child} onEvent={onEvent} />
          ))}
        </LazyComponent>
      );
    }
  }

  // ... rest of your existing component rendering logic
}

```

## Rust Extension Integration

```rust
// In your extension code
impl UIExtension for ChartExtension {
    fn render(&self, context: &RenderContext) -> Result<VirtualNode, RenderError> {
        let chart_node = VirtualNode {
            id: "chart-1".to_string(),
            component_type: ComponentType::Lazy {
                component_name: "LineChart".to_string(),
                library_name: "recharts".to_string(),
            },
            props: {
                let mut props = HashMap::new();
                props.insert("data".to_string(), json!(self.chart_data));
                props.insert("width".to_string(), json!(400));
                props.insert("height".to_string(), json!(300));
                props
            },
            children: vec![
                // XAxis, YAxis, Line components as children
            ],
            event_handlers: vec![],
        };

        Ok(chart_node)
    }
}

```