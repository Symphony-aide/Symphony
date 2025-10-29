//! Configuration hierarchical merging

use crate::SymphonyConfig;
use serde_json::Value;
use std::collections::HashMap;
use sytypes::SymphonyResult;

/// Configuration merger for hierarchical configuration
pub struct ConfigMerger;

impl ConfigMerger {
    /// Merge multiple configurations
    /// Later configurations override earlier ones
    pub fn merge_all(configs: Vec<SymphonyConfig>) -> SymphonyResult<SymphonyConfig> {
        if configs.is_empty() {
            return Ok(SymphonyConfig::default());
        }

        let mut result = configs[0].clone();
        for config in configs.iter().skip(1) {
            result = Self::merge(result, config.clone())?;
        }

        Ok(result)
    }

    /// Merge two configurations
    /// The second configuration overrides the first
    pub fn merge(base: SymphonyConfig, override_config: SymphonyConfig) -> SymphonyResult<SymphonyConfig> {
        Ok(SymphonyConfig {
            core: Self::merge_core(base.core, override_config.core),
            extensions: Self::merge_extensions(base.extensions, override_config.extensions),
            aide: Self::merge_aide(base.aide, override_config.aide),
            ide: Self::merge_ide(base.ide, override_config.ide),
            ipc: Self::merge_ipc(base.ipc, override_config.ipc),
            custom: Self::merge_maps(base.custom, override_config.custom),
        })
    }

    fn merge_core(base: crate::CoreConfig, override_config: crate::CoreConfig) -> crate::CoreConfig {
        crate::CoreConfig {
            log_level: if override_config.log_level != crate::CoreConfig::default().log_level {
                override_config.log_level
            } else {
                base.log_level
            },
            data_dir: if override_config.data_dir != crate::CoreConfig::default().data_dir {
                override_config.data_dir
            } else {
                base.data_dir
            },
            cache_dir: if override_config.cache_dir != crate::CoreConfig::default().cache_dir {
                override_config.cache_dir
            } else {
                base.cache_dir
            },
            max_concurrent_tasks: if override_config.max_concurrent_tasks != crate::CoreConfig::default().max_concurrent_tasks {
                override_config.max_concurrent_tasks
            } else {
                base.max_concurrent_tasks
            },
        }
    }

    fn merge_extensions(base: crate::ExtensionConfig, override_config: crate::ExtensionConfig) -> crate::ExtensionConfig {
        crate::ExtensionConfig {
            extensions_dir: if override_config.extensions_dir != crate::ExtensionConfig::default().extensions_dir {
                override_config.extensions_dir
            } else {
                base.extensions_dir
            },
            auto_update: override_config.auto_update,
            marketplace_url: if override_config.marketplace_url != crate::ExtensionConfig::default().marketplace_url {
                override_config.marketplace_url
            } else {
                base.marketplace_url
            },
        }
    }

    fn merge_aide(base: crate::AideConfig, override_config: crate::AideConfig) -> crate::AideConfig {
        crate::AideConfig {
            enabled: override_config.enabled,
            model_cache_dir: if override_config.model_cache_dir != crate::AideConfig::default().model_cache_dir {
                override_config.model_cache_dir
            } else {
                base.model_cache_dir
            },
            max_models_in_memory: if override_config.max_models_in_memory != crate::AideConfig::default().max_models_in_memory {
                override_config.max_models_in_memory
            } else {
                base.max_models_in_memory
            },
            artifact_retention_days: if override_config.artifact_retention_days != crate::AideConfig::default().artifact_retention_days {
                override_config.artifact_retention_days
            } else {
                base.artifact_retention_days
            },
        }
    }

    fn merge_ide(base: crate::IdeConfig, override_config: crate::IdeConfig) -> crate::IdeConfig {
        crate::IdeConfig {
            font_family: if override_config.font_family != crate::IdeConfig::default().font_family {
                override_config.font_family
            } else {
                base.font_family
            },
            font_size: if override_config.font_size != crate::IdeConfig::default().font_size {
                override_config.font_size
            } else {
                base.font_size
            },
            tab_size: if override_config.tab_size != crate::IdeConfig::default().tab_size {
                override_config.tab_size
            } else {
                base.tab_size
            },
            line_numbers: override_config.line_numbers,
            theme: if override_config.theme != crate::IdeConfig::default().theme {
                override_config.theme
            } else {
                base.theme
            },
        }
    }

    fn merge_ipc(base: crate::IpcConfig, override_config: crate::IpcConfig) -> crate::IpcConfig {
        crate::IpcConfig {
            transport: if override_config.transport != crate::IpcConfig::default().transport {
                override_config.transport
            } else {
                base.transport
            },
            format: if override_config.format != crate::IpcConfig::default().format {
                override_config.format
            } else {
                base.format
            },
            max_message_size: if override_config.max_message_size != crate::IpcConfig::default().max_message_size {
                override_config.max_message_size
            } else {
                base.max_message_size
            },
            connection_timeout: if override_config.connection_timeout != crate::IpcConfig::default().connection_timeout {
                override_config.connection_timeout
            } else {
                base.connection_timeout
            },
        }
    }

    fn merge_maps(mut base: HashMap<String, Value>, override_map: HashMap<String, Value>) -> HashMap<String, Value> {
        for (key, value) in override_map {
            base.insert(key, value);
        }
        base
    }
}
