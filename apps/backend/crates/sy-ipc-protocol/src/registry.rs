//! Message registry for type-safe message routing
//!
//! Provides a centralized registry for message types, serializers,
//! and schema validators with compile-time verification.

use crate::{
    MessageEnvelope, MessageType, SerializationFormat, MessageSerializer, SchemaValidator,
    schema::{JsonRpcSchema, MessageEnvelopeSchema},
    SerializationError,
};
use serde::{de::DeserializeOwned, Serialize};
use std::collections::HashMap;
use sy_commons::debug::duck;

/// Centralized message registry for type-safe operations
///
/// Manages message types, serializers, and schema validators
/// to provide a unified interface for message processing.
pub struct MessageRegistry {
    /// Message type mappings
    type_map: HashMap<String, MessageType>,
    /// Serializer implementations by format
    serializers: HashMap<SerializationFormat, MessageSerializer>,
    /// Schema validator
    validator: SchemaValidator,
}

impl MessageRegistry {
    /// Creates a new message registry with default serializers and schemas
    ///
    /// # Examples
    ///
    /// ```
    /// use sy_ipc_protocol::MessageRegistry;
    ///
    /// let registry = MessageRegistry::new();
    /// ```
    pub fn new() -> Self {
        duck!("Creating new message registry");
        
        let mut registry = Self {
            type_map: HashMap::new(),
            serializers: HashMap::new(),
            validator: SchemaValidator::new(),
        };

        // Register default serializers
        registry.register_serializer(
            SerializationFormat::MessagePack,
            MessageSerializer::message_pack(),
        );
        registry.register_serializer(
            SerializationFormat::Bincode,
            MessageSerializer::bincode(),
        );
        registry.register_serializer(
            SerializationFormat::Json,
            MessageSerializer::json(),
        );

        // Register default schemas
        registry.validator.register_schema(JsonRpcSchema);
        registry.validator.register_schema(MessageEnvelopeSchema);

        // Register default message types
        registry.register_message_type("pit_operation".to_string(), MessageType::PitOperation);
        registry.register_message_type("extension_command".to_string(), MessageType::ExtensionCommand);
        registry.register_message_type("conductor_decision".to_string(), MessageType::ConductorDecision);
        registry.register_message_type("data_access".to_string(), MessageType::DataAccess);
        registry.register_message_type("xi_request".to_string(), MessageType::XiRequest);
        registry.register_message_type("xi_response".to_string(), MessageType::XiResponse);
        registry.register_message_type("xi_notification".to_string(), MessageType::XiNotification);
        registry.register_message_type("xi_event".to_string(), MessageType::XiEvent);
        registry.register_message_type("health_check".to_string(), MessageType::HealthCheck);
        registry.register_message_type("system_event".to_string(), MessageType::SystemEvent);
        registry.register_message_type("error_report".to_string(), MessageType::ErrorReport);

        duck!("Message registry initialized with {} serializers and {} message types", 
              registry.serializers.len(), registry.type_map.len());
        
        registry
    }

    /// Registers a message type mapping
    ///
    /// # Arguments
    ///
    /// * `type_name` - String identifier for the message type
    /// * `message_type` - MessageType enum variant
    pub fn register_message_type(&mut self, type_name: String, message_type: MessageType) {
        duck!("Registering message type: {} -> {:?}", type_name, message_type);
        self.type_map.insert(type_name, message_type);
    }

    /// Registers a serializer for a format
    ///
    /// # Arguments
    ///
    /// * `format` - Serialization format
    /// * `serializer` - Serializer implementation
    pub fn register_serializer(
        &mut self,
        format: SerializationFormat,
        serializer: MessageSerializer,
    ) {
        duck!("Registering serializer for format: {:?}", format);
        self.serializers.insert(format, serializer);
    }

    /// Serializes a message envelope using the specified format
    ///
    /// # Arguments
    ///
    /// * `message` - Message envelope to serialize
    /// * `format` - Serialization format to use
    ///
    /// # Errors
    ///
    /// Returns `SerializationError` if serialization fails or format is unsupported
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use sy_ipc_protocol::{MessageRegistry, MessageEnvelope, MessageType, SerializationFormat};
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let registry = MessageRegistry::new();
    /// let envelope = MessageEnvelope::new(MessageType::PitOperation, "test".to_string());
    /// 
    /// let serialized = registry.serialize_message(&envelope, SerializationFormat::MessagePack).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn serialize_message<T>(
        &self,
        message: &MessageEnvelope<T>,
        format: SerializationFormat,
    ) -> Result<Vec<u8>, SerializationError>
    where
        T: Serialize + Send + Sync,
    {
        duck!("Serializing message with format: {:?}", format);
        
        let serializer = self
            .serializers
            .get(&format)
            .ok_or(SerializationError::UnsupportedFormat(format))?;

        serializer.serialize(message).await
    }

    /// Deserializes bytes to a message envelope using the specified format
    ///
    /// # Arguments
    ///
    /// * `data` - Bytes to deserialize
    /// * `format` - Serialization format used
    ///
    /// # Errors
    ///
    /// Returns `SerializationError` if deserialization fails or format is unsupported
    pub async fn deserialize_message<T>(
        &self,
        data: &[u8],
        format: SerializationFormat,
    ) -> Result<MessageEnvelope<T>, SerializationError>
    where
        T: DeserializeOwned + Send + Sync,
    {
        duck!("Deserializing message with format: {:?}", format);
        
        let serializer = self
            .serializers
            .get(&format)
            .ok_or(SerializationError::UnsupportedFormat(format))?;

        serializer.deserialize(data).await
    }

    /// Gets a message type by string identifier
    ///
    /// # Arguments
    ///
    /// * `type_name` - String identifier for the message type
    ///
    /// # Returns
    ///
    /// Returns `Some(MessageType)` if found, `None` otherwise
    pub fn get_message_type(&self, type_name: &str) -> Option<&MessageType> {
        self.type_map.get(type_name)
    }

    /// Gets the schema validator
    ///
    /// # Returns
    ///
    /// Reference to the schema validator
    pub fn validator(&self) -> &SchemaValidator {
        &self.validator
    }

    /// Gets a mutable reference to the schema validator
    ///
    /// # Returns
    ///
    /// Mutable reference to the schema validator
    pub fn validator_mut(&mut self) -> &mut SchemaValidator {
        &mut self.validator
    }

    /// Returns the number of registered message types
    pub fn message_type_count(&self) -> usize {
        self.type_map.len()
    }

    /// Returns the number of registered serializers
    pub fn serializer_count(&self) -> usize {
        self.serializers.len()
    }

    /// Returns whether a serialization format is supported
    ///
    /// # Arguments
    ///
    /// * `format` - Serialization format to check
    pub fn supports_format(&self, format: SerializationFormat) -> bool {
        self.serializers.contains_key(&format)
    }

    /// Lists all registered message type names
    pub fn message_type_names(&self) -> Vec<&String> {
        self.type_map.keys().collect()
    }

    /// Lists all supported serialization formats
    pub fn supported_formats(&self) -> Vec<SerializationFormat> {
        self.serializers.keys().copied().collect()
    }
}

impl Default for MessageRegistry {
    fn default() -> Self {
        Self::new()
    }
}