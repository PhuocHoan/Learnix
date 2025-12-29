import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginImportX from 'eslint-plugin-import-x';
import pluginSecurity from 'eslint-plugin-security';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // -------------------------------------------------------------------------
  // Global Ignores
  // -------------------------------------------------------------------------
  { ignores: ['dist', 'coverage', 'node_modules'] },

  // -------------------------------------------------------------------------
  // Base JavaScript Rules
  // -------------------------------------------------------------------------
  js.configs.recommended,

  // -------------------------------------------------------------------------
  // TypeScript Type-Aware Linting (scoped to .ts files for performance)
  // Using projectService for faster linting vs traditional project config
  // -------------------------------------------------------------------------
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),

  // -------------------------------------------------------------------------
  // Security Rules
  // -------------------------------------------------------------------------
  pluginSecurity.configs.recommended,

  // -------------------------------------------------------------------------
  // Prettier Integration (must be last to override conflicting rules)
  // -------------------------------------------------------------------------
  eslintPluginPrettierRecommended,

  // -------------------------------------------------------------------------
  // Main TypeScript Configuration
  // -------------------------------------------------------------------------
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        // projectService is the modern, performant approach for type-aware linting
        // It automatically discovers tsconfig.json without manual configuration
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': pluginImportX,
    },
    rules: {
      // -----------------------------------------------------------------------
      // TypeScript Best Practices
      // -----------------------------------------------------------------------
      '@typescript-eslint/explicit-function-return-type': 'off', // Inferred types are fine
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Controllers/services use decorators
      '@typescript-eslint/no-explicit-any': 'error', // Must use unknown or specific types
      '@typescript-eslint/no-floating-promises': 'error', // Must handle all promises
      '@typescript-eslint/require-await': 'error', // Async functions must use await
      '@typescript-eslint/prefer-promise-reject-errors': 'error', // Reject with Error objects
      '@typescript-eslint/return-await': ['error', 'always'], // Proper stack traces in try/catch
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // -----------------------------------------------------------------------
      // General Best Practices
      // -----------------------------------------------------------------------
      'no-console': 'error', // Use NestJS Logger instead

      // -----------------------------------------------------------------------
      // Import Organization (builtin → external → internal → relative → types)
      // -----------------------------------------------------------------------
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@nestjs/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'src/**',
              group: 'internal',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // DTOs & Entities - Allow explicit types for decorators (TypeORM/Swagger)
  // -------------------------------------------------------------------------
  {
    files: ['**/*.dto.ts', '**/*.entity.ts'],
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },

  // -------------------------------------------------------------------------
  // Scripts & Seeds - Allow console.log and relax type safety for CLI scripts
  // Scripts use dynamic requires, type assertions, and patterns unsuitable for strict type-checking
  // -------------------------------------------------------------------------
  {
    files: ['src/scripts/**/*.ts', 'src/seeds/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // -------------------------------------------------------------------------
  // Upload/Storage Modules - Relax filesystem security where path validation exists
  // -------------------------------------------------------------------------
  {
    files: ['**/upload/**/*.ts', '**/storage/**/*.ts', '**/cloudinary/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },

  // -------------------------------------------------------------------------
  // Test Files - Relax strict rules for testing flexibility
  // -------------------------------------------------------------------------
  {
    files: ['**/*.spec.ts', 'test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off', // Common in Jest mocks
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      'security/detect-object-injection': 'off',
      'no-console': 'off',
    },
  },
];
