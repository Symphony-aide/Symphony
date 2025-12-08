# Design Document: Primitives Extended Testing

## Overview

This design extends the Primitives Package testing suite with three additional testing methodologies to ensure comprehensive quality assurance:

1. **Snapshot Testing** - Captures and compares renderer output to detect unintended UI changes
2. **Contract Testing** - Validates IPC Bridge API contracts between frontend and backend
3. **Performance Testing** - Verifies render times against defined performance budgets

These tests complement the existing unit tests and property-based tests (using fast-check) to provide a complete testing strategy.

## Architecture

```
packages/primitives/__tests__/
├── core/                          # Existing tests
├── registry/                      # Existing tests
├── renderers/
│   ├── PrimitiveRenderer.property.test.js  # Existing
│   ├── PrimitiveRenderer.snapshot.test.jsx # NEW: Snapshot tests
│   └── __snapshots__/                      # Snapshot files
├── ipc/
│   ├── IPCBridge.test.js                   # Existing
│   └── IPCBridge.contract.test.js          # NEW: Contract tests
├── monitoring/
│   ├── PerformanceMonitor.property.test.js # Existing
│   └── PerformanceMonitor.perf.test.js     # NEW: Performance tests
└── performance/
    └── render.perf.test.js                 # NEW: Render performance tests
```

## Components and Interfaces

### Snapshot Testing Infrastructure

```javascript
/**
 * @typedef {Object} SnapshotTestConfig
 * @property {boolean} [updateSnapshots] - Whether to update snapshots
 * @property {string} [snapshotDir] - Directory for snapshot files
 */

// Test utilities for snapshot testing
const renderPrimitiveToSnapshot = (primitive) => {
  // Renders primitive and returns serializable structure
};

const createTestPrimitive = (type, props, children) => {
  // Factory for creating test primitives
};
```

### Contract Testing Infrastructure

```javascript
/**
 * @typedef {Object} IPCContractSchema
 * @property {Object} request - Request schema
 * @property {Object} successResponse - Success response schema
 * @property {Object} errorResponse - Error response schema
 */

/**
 * Contract schemas for each IPC method
 */
const IPC_CONTRACTS = {
  get_component_tree: {
    request: { name: 'string' },
    successResponse: {
      success: true,
      data: {
        id: 'string',
        type: 'string',
        props: 'object',
        renderStrategy: 'string',
        children: 'array'
      }
    },
    errorResponse: {
      success: false,
      error: 'string',
      code: 'string'
    }
  },
  // ... other contracts
};
```

### Performance Testing Infrastructure

```javascript
/**
 * @typedef {Object} PerformanceBenchmark
 * @property {string} name - Benchmark name
 * @property {number} threshold - Maximum acceptable time in ms
 * @property {number} iterations - Number of iterations to run
 */

/**
 * Performance thresholds by complexity
 */
const PERFORMANCE_THRESHOLDS = {
  simple: 5,      // Single primitive: < 5ms
  medium: 16,     // 10-20 nodes: < 16ms (60fps)
  complex: 50     // 50+ nodes: < 50ms
};
```

## Data Models

### Snapshot Test Data

```javascript
// Example snapshot structure for a Button primitive
{
  "type": "button",
  "props": {
    "className": "btn btn-primary",
    "data-primitive-id": "test-button-id"
  },
  "children": [
    {
      "type": "span",
      "props": { "className": "btn-content" },
      "children": ["Click Me"]
    }
  ]
}
```

### Contract Test Schemas

```javascript
// ComponentTree schema
const ComponentTreeSchema = {
  id: { type: 'string', required: true },
  type: { type: 'string', required: true },
  props: { type: 'object', required: true },
  renderStrategy: { 
    type: 'string', 
    enum: ['react', 'wasm', 'direct'],
    required: true 
  },
  children: { type: 'array', items: 'ComponentTree', required: true }
};

// IPC Response schemas
const SuccessResponseSchema = {
  success: { type: 'boolean', value: true },
  data: { type: 'any' },
  requestId: { type: 'string', optional: true }
};

const ErrorResponseSchema = {
  success: { type: 'boolean', value: false },
  error: { type: 'string', required: true },
  code: { type: 'string', required: true },
  requestId: { type: 'string', optional: true }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: IPC Response Schema Compliance
*For any* valid IPC request to get_component_tree, the response SHALL contain success boolean, and when successful, data SHALL contain id (string), type (string), props (object), renderStrategy (string), and children (array).
**Validates: Requirements 2.1**

### Property 2: IPC Modification Contract
*For any* valid modify_component request with name (string), path (array), and modifications (object), the response SHALL indicate success with modified=true, or failure with error code and message.
**Validates: Requirements 2.2**

### Property 3: IPC Insertion Contract
*For any* valid insert_component request with name, parentPath, and primitive tree, the successful response SHALL include inserted=true and a non-empty primitiveId string.
**Validates: Requirements 2.3**

### Property 4: IPC Removal Contract
*For any* valid remove_component request with name and path, the successful response SHALL include removed=true.
**Validates: Requirements 2.4**

### Property 5: IPC Handler Invocation Contract
*For any* valid invoke_motif_handler request with handlerId and args, the successful response SHALL include the result field containing the handler's return value.
**Validates: Requirements 2.5**

### Property 6: IPC Error Response Contract
*For any* invalid IPC request (missing required fields, invalid types), the error response SHALL contain success=false, a non-empty error message, and a non-empty error code.
**Validates: Requirements 2.6**

### Property 7: Simple Primitive Render Performance
*For any* simple primitive (Button, Text, Icon, Input, Checkbox), the render time SHALL be below 5ms.
**Validates: Requirements 3.1**

### Property 8: Medium Tree Render Performance
*For any* primitive tree with 10-20 nodes, the render time SHALL be below 16ms (60fps frame budget).
**Validates: Requirements 3.2**

### Property 9: Complex Tree Render Performance
*For any* primitive tree with 50 or more nodes, the render time SHALL be below 50ms.
**Validates: Requirements 3.3**

### Property 10: Performance Warning Trigger
*For any* render that exceeds the 16ms warning threshold, the PerformanceMonitor SHALL invoke the warning log callback with component name and duration.
**Validates: Requirements 3.5**

### Property 11: Budget Alert Trigger
*For any* component with a defined performance budget, when a render exceeds that budget, the PerformanceMonitor SHALL trigger an alert callback with the component name, duration, threshold, and level.
**Validates: Requirements 3.6**

## Error Handling

### Snapshot Test Failures

```javascript
// When snapshot doesn't match
class SnapshotMismatchError extends Error {
  constructor(componentType, diff) {
    super(`Snapshot mismatch for ${componentType}`);
    this.diff = diff;
  }
}
```

### Contract Test Failures

```javascript
// When contract is violated
class ContractViolationError extends Error {
  constructor(method, field, expected, actual) {
    super(`Contract violation in ${method}: ${field} expected ${expected}, got ${actual}`);
    this.method = method;
    this.field = field;
  }
}
```

### Performance Test Failures

```javascript
// When performance threshold is exceeded
class PerformanceThresholdError extends Error {
  constructor(componentName, actual, threshold) {
    super(`${componentName} render time ${actual}ms exceeds threshold ${threshold}ms`);
    this.actual = actual;
    this.threshold = threshold;
  }
}
```

## Testing Strategy

### Snapshot Testing Approach

**Framework**: Vitest with built-in snapshot support

**Test File Naming**: `*.snapshot.test.jsx`

**Snapshot Update**: Run `vitest --update` to update snapshots

**Coverage**:
- All layout primitives (Container, Flex, Grid, Panel, Divider)
- All interactive primitives (Button, Input, Icon, Text, Checkbox, Select)
- All complex primitives (List, Tabs, Dropdown, Modal, Tooltip)
- Nested tree structures
- ErrorBoundary fallback UI

### Contract Testing Approach

**Framework**: Vitest with custom schema validation

**Test File Naming**: `*.contract.test.js`

**Schema Validation**: Custom validators for IPC request/response schemas

**Coverage**:
- get_component_tree request/response
- modify_component request/response
- insert_component request/response
- remove_component request/response
- invoke_motif_handler request/response
- Error responses for all methods

### Performance Testing Approach

**Framework**: Vitest with performance.now() measurements

**Test File Naming**: `*.perf.test.js`

**Configuration**: 
- Minimum 10 iterations per benchmark
- Warm-up runs before measurement
- Statistical analysis (average, p95, p99)

**Coverage**:
- Simple primitive render times
- Medium complexity tree render times
- Complex tree render times
- PerformanceMonitor accuracy
- Warning/alert trigger verification
- Memory leak detection (sequential renders)

### Test Annotation Format

Each test MUST include a comment referencing the requirement:

```javascript
/**
 * **Feature: primitives-extended-testing, Property 1: IPC Response Schema Compliance**
 * Validates that get_component_tree responses match the ComponentTree schema
 */
```

