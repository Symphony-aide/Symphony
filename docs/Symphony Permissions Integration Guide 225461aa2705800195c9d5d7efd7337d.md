# Symphony Permissions Integration Guide

## Overview

This guide details how Symphony components integrate with the permissions system to ensure secure access to files, features, and AI capabilities while maintaining a seamless user experience.

## Permission Requirements

Components require various permissions to function properly:

```tsx
// ComponentPermissions.ts
export const ComponentPermissions = {
  // File system permissions
  FILE_READ: 'fs.read',
  FILE_WRITE: 'fs.write',

  // Language server permissions
  LSP_CONNECT: 'lsp.connect',
  LSP_DIAGNOSTICS: 'lsp.diagnostics',

  // AI model permissions
  AI_COMPLETION: 'ai.completion',
  AI_ANALYSIS: 'ai.analysis',

  // Extension permissions
  EXTENSION_API: 'component.extensionApi',

  // Clipboard permissions
  CLIPBOARD_READ: 'clipboard.read',
  CLIPBOARD_WRITE: 'clipboard.write'
};

```

## Permission Hook Integration

Components use a custom hook to manage permissions:

```tsx
// useComponentPermissions.ts
import { usePermission } from 'frontend/shared/extension-bridge';
import { ComponentPermissions } from './ComponentPermissions';

export const useComponentPermissions = (resourcePath) => {
  // File system permissions with path constraints
  const fileRead = usePermission(ComponentPermissions.FILE_READ, {
    scope: 'workspace',
    paths: [resourcePath]
  });

  const fileWrite = usePermission(ComponentPermissions.FILE_WRITE, {
    scope: 'workspace',
    paths: [resourcePath]
  });

  // AI model permissions
  const aiCompletion = usePermission(ComponentPermissions.AI_COMPLETION, {
    scope: 'workspace',
    paths: [resourcePath]
  });

  const aiAnalysis = usePermission(ComponentPermissions.AI_ANALYSIS, {
    scope: 'workspace',
    paths: [resourcePath]
  });

  // Extension API permissions
  const extensionApi = usePermission(ComponentPermissions.EXTENSION_API);

  // Clipboard permissions
  const clipboardRead = usePermission(ComponentPermissions.CLIPBOARD_READ);
  const clipboardWrite = usePermission(ComponentPermissions.CLIPBOARD_WRITE);

  // Helper function to request all required permissions
  const requestAllPermissions = async () => {
    const results = await Promise.all([
      fileRead.granted || fileRead.request(),
      fileWrite.granted || fileWrite.request(),
      aiCompletion.granted || aiCompletion.request(),
      aiAnalysis.granted || aiAnalysis.request(),
      extensionApi.granted || extensionApi.request(),
      clipboardRead.granted || clipboardRead.request(),
      clipboardWrite.granted || clipboardWrite.request()
    ]);

    return results.every(Boolean);
  };

  return {
    permissions: {
      fileRead,
      fileWrite,
      aiCompletion,
      aiAnalysis,
      extensionApi,
      clipboardRead,
      clipboardWrite
    },
    requestAllPermissions,
    allGranted: [
      fileRead.granted,
      fileWrite.granted,
      aiCompletion.granted,
      aiAnalysis.granted,
      extensionApi.granted,
      clipboardRead.granted,
      clipboardWrite.granted
    ].every(Boolean)
  };
};

```

## Component with Permissions

Components use the permissions hook to control feature availability:

```tsx
// SymphonyComponent.tsx with permissions
export const SymphonyComponent = ({ resourcePath, ...props }) => {
  const {
    permissions,
    allGranted,
    requestAllPermissions
  } = useComponentPermissions(resourcePath);

  const {
    aiSuggestions,
    requestAnalysis,
    isProcessing
  } = useAIModelIntegration();

  // Request permissions when needed
  const handleComponentMount = async () => {
    if (!allGranted) {
      const granted = await requestAllPermissions();
      if (!granted) {
        console.warn('Some component permissions were denied');
      }
    }
  };

  // Conditionally enable features based on permissions
  const handleRequestAnalysis = async (data, context) => {
    if (permissions.aiAnalysis.granted) {
      return requestAnalysis(data, context);
    } else {
      const granted = await permissions.aiAnalysis.request();
      if (granted) {
        return requestAnalysis(data, context);
      } else {
        console.warn('AI analysis permission denied');
        return null;
      }
    }
  };

  return (
    <div className="symphony-component-container">
      <Component
        {...props}
        resourcePath={resourcePath}
        suggestions={permissions.aiCompletion.granted ? aiSuggestions : []}
        onRequestAnalysis={handleRequestAnalysis}
        isAIProcessing={isProcessing}
        onMount={handleComponentMount}
        readOnly={!permissions.fileWrite.granted}
      />

      {/* Permission status indicators */}
      <div className="component-permission-status">
        {!permissions.fileWrite.granted && (
          <div className="permission-badge read-only">
            Read Only
          </div>
        )}
        {!permissions.aiCompletion.granted && (
          <div className="permission-badge ai-disabled">
            AI Disabled
          </div>
        )}
      </div>
    </div>
  );
};

```

## Permission Declaration in Extension Manifest

When components are packaged as extensions, they declare required permissions:

```json
{
  "id": "symphony.component",
  "name": "Symphony Component",
  "version": "1.0.0",
  "permissions": [
    {
      "id": "fs.read",
      "reason": "Required to open and read files in your workspace"
    },
    {
      "id": "fs.write",
      "reason": "Required to save changes to files"
    },
    {
      "id": "ai.completion",
      "reason": "Required for AI-powered completion features"
    },
    {
      "id": "ai.analysis",
      "reason": "Required for AI-powered analysis"
    },
    {
      "id": "component.extensionApi",
      "reason": "Required to support component extensions"
    },
    {
      "id": "clipboard.read",
      "reason": "Required for paste operations"
    },
    {
      "id": "clipboard.write",
      "reason": "Required for copy operations"
    }
  ]
}

```

## AI-Enhanced Permission Requests

Components leverage Symphony's AI models to provide context-aware permission requests:

```tsx
// AIPermissionContext.tsx
import { useAIPermissionContext } from 'frontend/shared/extension-bridge';

export const AIPermissionContext = ({ children }) => {
  const { enhancePermissionRequest } = useAIPermissionContext();

  useEffect(() => {
    enhancePermissionRequest('fs.write', async (context) => {
      return {
        explanation: `The component needs to save changes to ${context.resourcePath}`,
        riskAnalysis: {
          level: 'low',
          reason: 'File is within your workspace and contains standard data'
        },
        recommendation: 'allow'
      };
    });

    enhancePermissionRequest('ai.completion', async (context) => {
      return {
        explanation: `AI completion will analyze your data in ${context.resourcePath}`,
        riskAnalysis: {
          level: 'medium',
          reason: 'Data will be processed by AI models'
        },
        dataUsage: 'Your data will be sent to AI models but not stored permanently',
        recommendation: 'allow'
      };
    });

    return () => {
      // Cleanup
    };
  }, [enhancePermissionRequest]);

  return children;
};

```

## Permission Patterns

### Pattern 1: Graceful Degradation

```tsx
// Feature works with reduced functionality when permissions are denied
const handleFeature = async () => {
  if (permissions.aiAnalysis.granted) {
    return performAIAnalysis();
  } else {
    return performBasicAnalysis();
  }
};

```

### Pattern 2: Permission Gates

```tsx
// Feature is completely disabled without permission
const renderFeature = () => {
  if (!permissions.requiredPermission.granted) {
    return <PermissionRequired permission="requiredPermission" />;
  }
  return <Feature />;
};

```

### Pattern 3: Just-in-Time Permissions

```tsx
// Request permission only when feature is used
const handleFeatureActivation = async () => {
  if (!permissions.feature.granted) {
    const granted = await permissions.feature.request();
    if (!granted) return;
  }
  activateFeature();
};

```

## Best Practices

1. **Request Minimal Permissions**: Only request permissions actually needed
2. **Provide Clear Explanations**: Help users understand why permissions are needed
3. **Graceful Degradation**: When possible, provide reduced functionality instead of blocking
4. **Permission Indicators**: Show users the current permission status
5. **Context-Aware Requests**: Use AI to provide better permission explanations
6. **Lazy Permission Requests**: Request permissions when features are used, not upfront

## Integration Benefits

This permissions integration ensures that components:

1. Request appropriate permissions when needed
2. Adapt functionality based on granted permissions
3. Provide clear indicators of permission status
4. Leverage AI to provide context-aware permission requests
5. Maintain security boundaries while providing seamless user experience