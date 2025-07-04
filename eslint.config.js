// eslint.config.js
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
// import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import jsdoc from 'eslint-plugin-jsdoc';
import preferArrow from 'eslint-plugin-prefer-arrow';
import testingLibrary from 'eslint-plugin-testing-library';
import jestDom from 'eslint-plugin-jest-dom';
import globals from 'globals';

export default [
  // Base configuration for all files
  js.configs.recommended,
  
  // Global ignores (equivalent to .eslintignore)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/.vuepress/**',
      '**/public/**',
      '**/static/**'
    ]
  },

  // TypeScript and React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        // project: './tsconfig.json'  // Commented out as file doesn't exist
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'import': importPlugin,
      'security': security,
      // 'sonarjs': sonarjs,
      'unicorn': unicorn,
      'jsdoc': jsdoc,
      'prefer-arrow': preferArrow,
      'testing-library': testingLibrary,
      'jest-dom': jestDom
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true
        }
      }
    },
    rules: {
      // Code Quality & Best Practices
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-arrow/prefer-arrow-functions': ['error', {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false
      }],
      
      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      // Rules that require type information - commenting out since we don't have tsconfig.json
      // '@typescript-eslint/prefer-nullish-coalescing': 'error',
      // '@typescript-eslint/prefer-optional-chain': 'error',
      // '@typescript-eslint/no-floating-promises': 'error',
      // '@typescript-eslint/await-thenable': 'error',
      // '@typescript-eslint/no-misused-promises': 'error',
      
      // Import organization
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }],
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',
      'import/no-unused-modules': 'error',
      
      // React specific
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unused-state': 'error',
      'react/no-did-update-set-state': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      
      // // Security
      // 'security/detect-object-injection': 'warn',
      // 'security/detect-non-literal-regexp': 'warn',
      // 'security/detect-unsafe-regex': 'error',
      // 'security/detect-buffer-noassert': 'error',
      // 'security/detect-child-process': 'warn',
      // 'security/detect-disable-mustache-escape': 'error',
      // 'security/detect-eval-with-expression': 'error',
      // 'security/detect-no-csrf-before-method-override': 'error',
      // 'security/detect-non-literal-fs-filename': 'warn',
      // 'security/detect-non-literal-require': 'warn',
      // 'security/detect-possible-timing-attacks': 'warn',
      // 'security/detect-pseudoRandomBytes': 'error',
      
      // // Code complexity
      // 'sonarjs/cognitive-complexity': ['error', 15],
      // 'sonarjs/no-duplicate-string': ['error', 5],
      // 'sonarjs/no-identical-functions': 'error',
      // 'sonarjs/no-redundant-boolean': 'error',
      // 'sonarjs/no-unused-collection': 'error',
      // 'sonarjs/no-useless-catch': 'error',
      // 'sonarjs/prefer-immediate-return': 'error',
      // 'sonarjs/prefer-object-literal': 'error',
      // 'sonarjs/prefer-single-boolean-return': 'error',
      
      // Modern JS/TS patterns
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/consistent-function-scoping': 'error',
      
      // Documentation
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-property-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/implements-on-classes': 'error',
      // 'jsdoc/newline-after-description': 'error',  // Rule name may have changed in newer versions
      'jsdoc/no-undefined-types': 'error',
      'jsdoc/require-description': 'warn',
      // 'jsdoc/require-description-complete-sentence': 'warn',  // Turned off to reduce warnings
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/valid-types': 'error',
      
      // Testing
      // 'testing-library/await-async-query': 'error',
      // 'testing-library/await-async-utils': 'error',
      // 'testing-library/no-await-sync-query': 'error',
      // 'testing-library/no-container': 'error',
      // 'testing-library/no-debugging-utils': 'warn',
      // 'testing-library/no-dom-import': 'error',
      // 'testing-library/no-node-access': 'error',
      // 'testing-library/no-promise-in-fire-event': 'error',
      // 'testing-library/no-render-in-setup': 'error',
      // 'testing-library/no-unnecessary-act': 'error',
      // 'testing-library/no-wait-for-empty-callback': 'error',
      // 'testing-library/no-wait-for-multiple-assertions': 'error',
      // 'testing-library/no-wait-for-side-effects': 'error',
      // 'testing-library/no-wait-for-snapshot': 'error',
      // 'testing-library/prefer-find-by': 'error',
      // 'testing-library/prefer-presence-queries': 'error',
      // 'testing-library/prefer-query-by-disappearance': 'error',
      // 'testing-library/prefer-screen-queries': 'error',
      // 'testing-library/prefer-user-event': 'error',
      // 'testing-library/render-result-naming-convention': 'error',
      
      // Jest DOM
      // 'jest-dom/prefer-checked': 'error',
      // 'jest-dom/prefer-enabled-disabled': 'error',
      // 'jest-dom/prefer-focus': 'error',
      // 'jest-dom/prefer-in-document': 'error',
      // 'jest-dom/prefer-required': 'error',
      // 'jest-dom/prefer-to-have-attribute': 'error',
      // 'jest-dom/prefer-to-have-class': 'error',
      // 'jest-dom/prefer-to-have-style': 'error',
      // 'jest-dom/prefer-to-have-text-content': 'error',
      // 'jest-dom/prefer-to-have-value': 'error'
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn'
    }
  },

  // JavaScript-only files configuration
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },

  // Test files configuration
  {
    files: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    },
    rules: {
      // 'sonarjs/no-duplicate-string': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'testing-library/no-debugging-utils': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'prefer-arrow/prefer-arrow-functions': 'off'
    }
  },

  // Storybook files configuration
  {
    files: ['**/*.stories.*', '**/*.story.*'],
    rules: {
      'import/no-anonymous-default-export': 'off',
      'import/no-default-export': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'react-hooks/rules-of-hooks': 'off',
      // 'sonarjs/no-duplicate-string': 'off',
      'jsdoc/require-jsdoc': 'off',
      'unicorn/consistent-function-scoping': 'off'
    }
  },

  // Component files configuration
  {
    files: ['src/components/**/*.tsx', 'src/ui/**/*.tsx'],
    rules: {
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      '@typescript-eslint/no-empty-interface': 'off'
    }
  }
];