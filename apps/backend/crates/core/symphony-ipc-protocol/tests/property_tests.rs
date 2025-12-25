//! Property-based tests for message envelope design

use symphony_ipc_protocol::*;
use proptest::prelude::*;
use std::collections::HashSet;

proptest! {
    /// Property: MessageId generation produces unique values
    #[test]
    fn message_id_uniqueness(count in 1..1000usize) {
        let ids: HashSet<MessageId> = (0..count)
            .map(|_| MessageId::new())
            .collect();
        prop_assert_eq!(ids.len(), count);
    }

    /// Property: Priority ordering is consistent with integer ordering
    #[test]
    fn priority_ordering_consistency(p1 in any::<i32>(), p2 in any::<i32>()) {
        let priority1 = Priority::custom(p1);
        let priority2 = Priority::custom(p2);
        prop_assert_eq!(priority1.cmp(&priority2), p1.cmp(&p2));
    }

    /// Property: MessageId string round-trip is identity
    #[test]
    fn message_id_string_roundtrip(_seed in any::<u64>()) {
        let original = MessageId::new();
        let string_repr = original.to_string();
        let parsed = MessageId::from_str(&string_repr).unwrap();
        prop_assert_eq!(original, parsed);
    }

    /// Property: EndpointId preserves input string
    #[test]
    fn endpoint_id_preserves_string(s in "[a-zA-Z0-9_-]{1,100}") {
        let endpoint = EndpointId::new(&s);
        prop_assert_eq!(endpoint.as_str(), s);
    }

    /// Property: Message builder with valid inputs always succeeds
    #[test]
    fn message_builder_valid_inputs_succeed(
        msg_type in prop_oneof![
            Just(MessageType::Request),
            Just(MessageType::Response),
            Just(MessageType::Event),
            Just(MessageType::Error),
            Just(MessageType::Heartbeat),
        ],
        source in "[a-zA-Z0-9_-]{1,50}",
        target in "[a-zA-Z0-9_-]{1,50}",
        payload in ".*",
        priority_level in any::<i32>(),
    ) {
        let result = Message::builder()
            .message_type(msg_type)
            .source(EndpointId::new(source))
            .target(EndpointId::new(target))
            .priority(Priority::custom(priority_level))
            .payload(payload.clone())
            .build();
        
        prop_assert!(result.is_ok());
        
        let message = result.unwrap();
        prop_assert_eq!(message.header.message_type, msg_type);
        prop_assert_eq!(message.payload, payload);
        prop_assert_eq!(message.header.priority.level(), priority_level);
    }

    /// Property: Message cloning preserves all fields
    #[test]
    fn message_cloning_preserves_fields(
        msg_type in prop_oneof![
            Just(MessageType::Request),
            Just(MessageType::Response),
            Just(MessageType::Event),
            Just(MessageType::Error),
            Just(MessageType::Heartbeat),
        ],
        source in "[a-zA-Z0-9_-]{1,50}",
        target in "[a-zA-Z0-9_-]{1,50}",
        payload in ".*",
    ) {
        let original = Message::builder()
            .message_type(msg_type)
            .source(EndpointId::new(source))
            .target(EndpointId::new(target))
            .payload(payload)
            .build()
            .unwrap();
        
        let cloned = original.clone();
        prop_assert_eq!(original, cloned);
    }

    /// Property: Priority system levels are correctly identified
    #[test]
    fn priority_system_levels_identified(level in any::<i32>()) {
        let priority = Priority::custom(level);
        let is_system = matches!(level, 1000 | 100 | 0 | -100 | -1000);
        prop_assert_eq!(priority.is_system_level(), is_system);
    }

    /// Property: Protocol version compatibility is symmetric for same major version
    #[test]
    fn protocol_version_compatibility_symmetric(
        major in 0u16..10u16,
        minor1 in 0u16..100u16,
        minor2 in 0u16..100u16,
    ) {
        let v1 = ProtocolVersion::new(major, minor1);
        let v2 = ProtocolVersion::new(major, minor2);
        
        // Same major version should be compatible both ways
        prop_assert_eq!(v1.is_compatible(&v2), v2.is_compatible(&v1));
        prop_assert!(v1.is_compatible(&v2)); // Same major version is always compatible
    }

    /// Property: Protocol version compatibility fails for different major versions
    #[test]
    fn protocol_version_different_major_incompatible(
        major1 in 0u16..10u16,
        major2 in 0u16..10u16,
        minor1 in 0u16..100u16,
        minor2 in 0u16..100u16,
    ) {
        prop_assume!(major1 != major2);
        
        let v1 = ProtocolVersion::new(major1, minor1);
        let v2 = ProtocolVersion::new(major2, minor2);
        
        prop_assert!(!v1.is_compatible(&v2));
        prop_assert!(!v2.is_compatible(&v1));
    }

    /// Property: Message metadata can store arbitrary JSON values
    #[test]
    fn message_metadata_stores_json_values(
        key in "[a-zA-Z_][a-zA-Z0-9_]{0,49}",
        value_type in 0..4u8,
    ) {
        let json_value = match value_type {
            0 => serde_json::Value::String("test".to_string()),
            1 => serde_json::Value::Number(serde_json::Number::from(42)),
            2 => serde_json::Value::Bool(true),
            _ => serde_json::Value::Null,
        };
        
        let message = Message::builder()
            .message_type(MessageType::Event)
            .source(EndpointId::new("source"))
            .target(EndpointId::new("target"))
            .payload("test")
            .metadata(&key, json_value.clone())
            .build()
            .unwrap();
        
        prop_assert_eq!(message.get_metadata(&key), Some(&json_value));
    }
}

// Additional property tests for edge cases
proptest! {
    /// Property: Empty endpoint IDs are handled correctly
    #[test]
    fn empty_endpoint_ids_handled(empty_str in Just("")) {
        let endpoint = EndpointId::new(empty_str);
        prop_assert_eq!(endpoint.as_str(), "");
    }

    /// Property: Very long endpoint IDs are preserved
    #[test]
    fn long_endpoint_ids_preserved(long_str in "[a-zA-Z0-9_-]{1000,2000}") {
        let endpoint = EndpointId::new(&long_str);
        prop_assert_eq!(endpoint.as_str(), long_str);
    }

    /// Property: Extreme priority values work correctly
    #[test]
    fn extreme_priority_values(level in i32::MIN..=i32::MAX) {
        let priority = Priority::custom(level);
        prop_assert_eq!(priority.level(), level);
        
        // Ordering should still work
        let normal = Priority::NORMAL;
        if level > 0 {
            prop_assert!(priority > normal);
        } else if level < 0 {
            prop_assert!(priority < normal);
        } else {
            prop_assert_eq!(priority, normal);
        }
    }
}