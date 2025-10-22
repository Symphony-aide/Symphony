# ADR-008: Database Architecture

- **Title**: - Separated Service vs Embedded Approach
- **Status**: Proposal
- **Date**: 2025-10-10
- **Authors**: Symphony Team

## Core Sections

### 1. Summary

We have decided to implement a separated database service architecture rather than embedding the database within the editor. This approach creates an independent service that serves both the Symphony Editor and official website via HTTP APIs, enabling technology flexibility and better architectural separation.

### 2. Context

Symphony IDE requires robust data management for user profiles, extension marketplace, synchronization, and analytics. The current architecture involves a Rust-based editor and a React-based website, both needing access to shared data. The core challenge is balancing performance, development velocity, and architectural cleanliness.

**Key Requirements:**

- Multi-client access (editor + website) to shared data
- Offline capability for editor with sync when online
- Rapid development of marketplace and user features
- Scalable user and extension management
- Technology flexibility for different component needs

**Stakeholders Affected:**

- End users (seamless experience across editor and website)
- Development team (productivity and technology choices)
- Business stakeholders (time-to-market and feature velocity)
- Operations team (deployment and maintenance complexity)

**Technical Environment:**

- Rust-based editor with performance-critical components
- React-based website requiring real-time data
- Expected scale: 50,000+ users, 1,000+ extensions
- Need for rapid iteration on marketplace and user features

### 3. Decision

We will implement a separated database service that operates as an independent component, serving both the Symphony Editor and official website through well-defined HTTP APIs. This service will be developed in Python to leverage our team's expertise and the rich web development ecosystem.

```
┌─────────────────┐          HTTP APIs          ┌─────────────────────┐
│   Symphony      │◄───────────────────────────►│   Database Service  │
│    Editor       │                             │     (Python)        │
│   (Rust)        │                             │                     │
│                 │                             │ • User Management   │
│ • Local Cache   │                             │ • Extension Registry│
│ • Offline Sync  │                             │ • Analytics         │
└─────────────────┘                             │ • Marketplace Data  │
         │                                      └─────────────────────┘
         │                                               │
┌─────────────────┐                                      │
│   Official      │◄─────────────────────────────────────┘
│    Website      │
│   (React)       │
│                 │
│ • Landing       │
│ • Marketplace   │
│ • Documentation │
└─────────────────┘

```

The editor maintains a local cache (Schema Vault) for offline operation and synchronizes with the central service when online. The website interacts directly with the database service for all data needs.

### 4. Rationale

**4.1 Technology Flexibility and Team Expertise**
By separating the database service, we can choose the optimal technology stack for data management rather than being constrained to Rust. Python offers superior web development ecosystems (FastAPI, SQLAlchemy, Pydantic) and aligns with our team's existing expertise, reducing development time from weeks to days for equivalent features.

**4.2 Clear Separation of Concerns**
The separated architecture allows each component to focus on its core competency: the editor excels at performance-critical IDE operations in Rust, while the database service handles data management, business logic, and API delivery in Python. This separation prevents the editor from being burdened with serving web requests.

**4.3 Multi-Client Support Architecture**
A centralized service naturally supports multiple clients (editor, website, future mobile apps) with consistent data and business logic. This eliminates data synchronization conflicts and ensures all clients see the same user experience.

**4.4 Development Velocity and Ecosystem Access**
Python's ecosystem provides immediate access to essential services: Stripe for payments, SendGrid for email, Celery for background tasks, and Pandas for analytics. These integrations would require significant custom development in Rust.

**4.5 Scalability and Independent Deployment**
The database service can scale independently based on user growth and feature demands. We can deploy, monitor, and optimize the service without affecting the editor's performance or release cycle.

**Trade-offs Accepted:**

**4.6 Network Dependency and Latency**
We accept that editor operations requiring central data will have network latency (typically 50-200ms). This is mitigated through intelligent local caching and background synchronization.

**4.7 Operational Complexity**
Running a separate service increases operational overhead. We mitigate this with containerization, monitoring, and automated deployment pipelines.

**4.8 Security Surface Area**
An external service increases the attack surface. We address this with robust authentication, rate limiting, and security monitoring.

### 5. Alternatives Considered

**5.1 Nested Database Inside Editor (Rust)**

**Pros:**

- Maximum performance for editor data access (microsecond latency)
- Simplified deployment (single binary)
- Reduced operational complexity (one component to manage)
- No network latency for data operations

**Cons:**

- Technology lock-in to Rust for all data management features
- Limited web development ecosystem in Rust
- Website performance dependent on user's editor instance
- Complex data synchronization between editor and website
- Difficulty scaling editor to handle web traffic

**Rejected because:** The limitations on development velocity, ecosystem access, and multi-client support outweighed the performance benefits. Rust's web development ecosystem is immature compared to Python, and forcing the editor to serve web requests would compromise its primary function as an IDE.

**5.2 Hybrid Embedded Database with Sync Service**

**Pros:**

- Local editor performance maintained
- Some separation of data management concerns
- Gradual migration path from embedded to separated

**Cons:**

- Complex synchronization logic between embedded and central databases
- Dual maintenance of data access patterns
- Inconsistent feature availability between online/offline modes
- Higher development and testing complexity

**Rejected because:** The synchronization complexity and dual maintenance overhead created more problems than it solved. The hybrid approach would delay rather than solve the fundamental architectural mismatch.

### 6. Consequences

**Positive:**

**6.1 Accelerated Feature Development**
Database and marketplace features can be developed 3-4x faster using Python's ecosystem versus Rust. This reduces time-to-market for critical user-facing features.

**6.2 Optimal Technology Alignment**
Each component uses the most appropriate technology: Rust for performance-critical editor operations, Python for rapid web service development, React for interactive UIs.

**6.3 Improved Team Productivity**
Development teams can work in their areas of expertise without cross-technology context switching. Python developers focus on services, Rust developers on editor performance.

**6.4 Business Flexibility**
The separated service enables future business models (SaaS offerings, enterprise features, mobile applications) without fundamental architectural changes.

**Negative:**

**6.5 Network Reliability Dependency**
Editor features requiring central data become dependent on network availability and quality. This requires robust offline capabilities and graceful degradation.

**6.6 Increased Operational Overhead**
Managing a separate service requires additional deployment, monitoring, and maintenance resources compared to a single embedded solution.

**6.7 Security Complexity**
Additional security measures are needed for API authentication, rate limiting, and data protection across service boundaries.

**6.8 Testing Complexity**
End-to-end testing requires coordinating multiple services and testing both online and offline scenarios.

### 7. Success Criteria

**7.1 Development Velocity**

- New API endpoints delivered within 2 days vs 1 week in Rust
- Database schema changes deployed within 1 hour vs 4 hours
- 95% reduction in lines of code for common web service patterns

**7.2 Performance Metrics**

- Database service response times < 100ms for 95% of requests
- Editor sync operations complete within 2 seconds
- 99.9% service availability during business hours

**7.3 User Experience**

- Seamless multi-device synchronization with < 5 minute data freshness
- Zero data loss during network partitions
- Marketplace features available simultaneously on editor and website

**7.4 Business Impact**

- Marketplace launch accelerated by 8 weeks vs Rust implementation
- 50% reduction in development costs for user management features
- Successful integration of 3+ third-party services (payments, analytics, email)

### 8. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Service Availability** | High | Implement robust health checks, auto-scaling, and fallback caching in editor |
| **Data Consistency** | High | Use database transactions, conflict resolution strategies, and audit logging |
| **Security Breaches** | High | Implement OAuth2, rate limiting, input validation, and security monitoring |
| **Performance Bottlenecks** | Medium | Database query optimization, caching layers, and performance monitoring |
| **Team Skill Gaps** | Medium | Cross-training, documentation, and hiring for Python service expertise |
| **Synchronization Conflicts** | Medium | Last-write-wins with manual resolution for critical data, automated for non-critical |
| **Third-party Dependency** | Low | Vendor-agnostic abstractions and contingency plans for critical services |

---

## References

[**Analysis**](Analysis%20288461aa270580be9660e8c955b40600.md)