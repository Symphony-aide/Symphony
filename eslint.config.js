import baseConfig from 'config/eslint.config.js';

export default [
  ...baseConfig,
  {
    files: [
      'apps/web/**/*.{ts,tsx,js,jsx}',
      'frontend/**/*.{ts,tsx,js,jsx}'
    ],
    // Additional rules specific to these files
  }
];
