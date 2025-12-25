//! Unit tests for individual components

use symphony_ipc_protocol::*;
use std::collections::HashSet;
use std::time::Duration;

#[cfg(test)]
mod message_id_tests {
    use super::*;

    #[test]
    fn test_message_id_creation() {
        let id = MessageId::new();
        assert!(!id.to_string().is_empty());
    }

    #[test]
    fn test_message_id_uniqueness() {
        let id1 = MessageId::new();
        let id2 = MessageId::new();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_message_id_from_string() {
        let id = MessageId::new();
        let id_str = id.to_string();
        let parsed_id = MessageId::from_str(&id_str).expect("Should parse valid UUID");
        assert_eq!(id, parsed_id);
    }

    #[test]
    fn test_message_id_invalid_string() {
        let result = MessageId::from_str("invalid-uuid");
        assert!(result.is_err());
    }

    #[test]
    fn test_message_id_display() {
        let id = MessageId::new();
        let display_str = format!("{}", id);
        assert!(!display_str.is_empty());
        assert_eq!(display_str, id.to_string());
    }
}

#[cfg(test)]
mod endpoint_id_tests {
    use super::*;

    #[test]
    fn test_endpoint_id_creation() {
        let endpoint = EndpointId::new("test-endpoint");
        assert_eq!(endpoint.as_str(), "test-endpoint");
    }

    #[test]
    fn test_endpoint_id_display() {
        let endpoint = EndpointId::new("display-test");
        assert_eq!(format!("{}", endpoint), "display-test");
    }

    #[test]
    fn test_endpoint_id_equality() {
        let endpoint1 = EndpointId::new("same");
        let endpoint2 = EndpointId::new("same");
        let endpoint3 = EndpointId::new("different");
        
        assert_eq!(endpoint1, endpoint2);
        assert_ne!(endpoint1, endpoint3);
    }
}

#[cfg(test)]
mod message_type_tests {
    use super::*;

    #[test]
    fn test_message_type_expects_response() {
        assert!(MessageType::Request.expects_response());
        assert!(!MessageType::Response.expects_response());
        assert!(!MessageType::Event.expects_response());
        assert!(!MessageType::Error.expects_response());
        assert!(!MessageType::Heartbeat.expects_response());
    }

    #[test]
    fn test_message_type_description() {
        assert!(!MessageType::Request.description().is_empty());
        assert!(!MessageType::Response.description().is_empty());
        assert!(!MessageType::Event.description().is_empty());
        assert!(!MessageType::Error.description().is_empty());
        assert!(!MessageType::Heartbeat.description().is_empty());
    }

    #[test]
    fn test_message_type_display() {
        assert_eq!(format!("{}", MessageType::Request), "Request");
        assert_eq!(format!("{}", MessageType::Response), "Response");
        assert_eq!(format!("{}", MessageType::Event), "Event");
        assert_eq!(format!("{}", MessageType::Error), "Error");
        assert_eq!(format!("{}", MessageType::Heartbeat), "Heartbeat");
    }
}

#[cfg(test)]
mod priority_tests {
    use super::*;

    #[test]
    fn test_priority_constants() {
        assert_eq!(Priority::CRITICAL.level(), 1000);
        assert_eq!(Priority::HIGH.level(), 100);
        assert_eq!(Priority::NORMAL.level(), 0);
        assert_eq!(Priority::LOW.level(), -100);
        assert_eq!(Priority::BACKGROUND.level(), -1000);
    }

    #[test]
    fn test_priority_custom() {
        let custom = Priority::custom(500);
        assert_eq!(custom.level(), 500);
    }

    #[test]
    fn test_priority_ordering() {
        assert!(Priority::CRITICAL > Priority::HIGH);
        assert!(Priority::HIGH > Priority::NORMAL);
        assert!(Priority::NORMAL > Priority::LOW);
        assert!(Priority::LOW > Priority::BACKGROUND);
        
        let custom_high = Priority::custom(200);
        assert!(custom_high > Priority::HIGH);
        assert!(custom_high < Priority::CRITICAL);
    }

    #[test]
    fn test_priority_is_system_level() {
        assert!(Priority::CRITICAL.is_system_level());
        assert!(Priority::HIGH.is_system_level());
        assert!(Priority::NORMAL.is_system_level());
        assert!(Priority::LOW.is_system_level());
        assert!(Priority::BACKGROUND.is_system_level());
        
        assert!(!Priority::custom(50).is_system_level());
    }

    #[test]
    fn test_priority_default() {
        assert_eq!(Priority::default(), Priority::NORMAL);
    }

    #[test]
    fn test_priority_display() {
        assert_eq!(format!("{}", Priority::CRITICAL), "Critical(1000)");
        assert_eq!(format!("{}", Priority::NORMAL), "Normal(0)");
        assert_eq!(format!("{}", Priority::custom(42)), "Custom(42)");
    }
}

#[cfg(test)]
mod protocol_version_tests {
    use super::*;

    #[test]
    fn test_protocol_version_current() {
        let current = ProtocolVersion::CURRENT;
        assert_eq!(current.major, 1);
        assert_eq!(current.minor, 0);
    }

    #[test]
    fn test_protocol_version_new() {
        let version = ProtocolVersion::new(2, 5);
        assert_eq!(version.major, 2);
        assert_eq!(version.minor, 5);
    }

    #[test]
    fn test_protocol_version_compatibility() {
        let v1_0 = ProtocolVersion::new(1, 0);
        let v1_1 = ProtocolVersion::new(1, 1);
        let v2_0 = ProtocolVersion::new(2, 0);
        
        // Same major version should be compatible
        assert!(v1_0.is_compatible(&v1_1));
        assert!(v1_1.is_compatible(&v1_0));
        
        // Different major version should not be compatible
        assert!(!v1_0.is_compatible(&v2_0));
        assert!(!v2_0.is_compatible(&v1_0));
    }

    #[test]
    fn test_protocol_version_default() {
        assert_eq!(ProtocolVersion::default(), ProtocolVersion::CURRENT);
    }

    #[test]
    fn test_protocol_version_display() {
        let version = ProtocolVersion::new(1, 2);
        assert_eq!(format!("{}", version), "1.2");
    }
}

#[cfg(test)]
mod message_header_tests {
    use super::*;

    #[test]
    fn test_message_header_creation() {
        let header = MessageHeader::new(
            MessageType::Request,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        
        assert_eq!(header.message_type, MessageType::Request);
        assert_eq!(header.source.as_str(), "source");
        assert_eq!(header.target.as_str(), "target");
        assert!(header.correlation_id.is_none());
        assert!(header.ttl.is_none());
        assert_eq!(header.priority, Priority::NORMAL);
        assert_eq!(header.version, ProtocolVersion::CURRENT);
    }

    #[test]
    fn test_message_header_with_correlation_id() {
        let correlation_id = MessageId::new();
        let header = MessageHeader::new(
            MessageType::Response,
            EndpointId::new("source"),
            EndpointId::new("target"),
        ).with_correlation_id(correlation_id.clone());
        
        assert_eq!(header.correlation_id, Some(correlation_id));
    }

    #[test]
    fn test_message_header_with_ttl() {
        let ttl = Duration::from_secs(30);
        let header = MessageHeader::new(
            MessageType::Event,
            EndpointId::new("source"),
            EndpointId::new("target"),
        ).with_ttl(ttl);
        
        assert_eq!(header.ttl, Some(ttl));
    }

    #[test]
    fn test_message_header_with_priority() {
        let header = MessageHeader::new(
            MessageType::Error,
            EndpointId::new("source"),
            EndpointId::new("target"),
        ).with_priority(Priority::CRITICAL);
        
        assert_eq!(header.priority, Priority::CRITICAL);
    }

    #[test]
    fn test_message_header_age() {
        let header = MessageHeader::new(
            MessageType::Heartbeat,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        
        std::thread::sleep(Duration::from_millis(10));
        let age = header.age();
        assert!(age >= Duration::from_millis(10));
    }

    #[test]
    fn test_message_header_expiration() {
        let header = MessageHeader::new(
            MessageType::Event,
            EndpointId::new("source"),
            EndpointId::new("target"),
        ).with_ttl(Duration::from_millis(1));
        
        // Should not be expired immediately
        assert!(!header.is_expired());
        
        // Wait for expiration
        std::thread::sleep(Duration::from_millis(10));
        assert!(header.is_expired());
    }

    #[test]
    fn test_message_header_no_ttl_never_expires() {
        let header = MessageHeader::new(
            MessageType::Event,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        
        // Without TTL, message should never expire
        assert!(!header.is_expired());
    }
}

#[cfg(test)]
mod message_tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let header = MessageHeader::new(
            MessageType::Request,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        let payload = "test payload";
        
        let message = Message::new(header.clone(), payload);
        assert_eq!(message.header, header);
        assert_eq!(message.payload, payload);
        assert!(message.metadata.is_empty());
    }

    #[test]
    fn test_message_with_metadata() {
        let header = MessageHeader::new(
            MessageType::Event,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        
        let message = Message::new(header, "payload")
            .with_metadata("key1", serde_json::Value::String("value1".to_string()))
            .with_metadata("key2", serde_json::Value::Number(serde_json::Number::from(42)));
        
        assert_eq!(message.metadata.len(), 2);
        assert_eq!(
            message.get_metadata("key1"),
            Some(&serde_json::Value::String("value1".to_string()))
        );
        assert_eq!(
            message.get_metadata("key2"),
            Some(&serde_json::Value::Number(serde_json::Number::from(42)))
        );
        assert_eq!(message.get_metadata("nonexistent"), None);
    }

    #[test]
    fn test_message_expiration() {
        let header = MessageHeader::new(
            MessageType::Event,
            EndpointId::new("source"),
            EndpointId::new("target"),
        ).with_ttl(Duration::from_millis(1));
        
        let message = Message::new(header, "payload");
        
        // Should not be expired immediately
        assert!(!message.is_expired());
        
        // Wait for expiration
        std::thread::sleep(Duration::from_millis(10));
        assert!(message.is_expired());
    }

    #[test]
    fn test_message_age() {
        let header = MessageHeader::new(
            MessageType::Heartbeat,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        
        let message = Message::new(header, "payload");
        
        std::thread::sleep(Duration::from_millis(10));
        let age = message.age();
        assert!(age >= Duration::from_millis(10));
    }

    #[test]
    fn test_message_map_payload() {
        let header = MessageHeader::new(
            MessageType::Request,
            EndpointId::new("source"),
            EndpointId::new("target"),
        );
        
        let message = Message::new(header.clone(), "42");
        let mapped = message.map_payload(|s| s.parse::<i32>().unwrap());
        
        assert_eq!(mapped.header, header);
        assert_eq!(mapped.payload, 42);
    }
}