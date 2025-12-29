import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginImportX from 'eslint-plugin-import-x';
import pluginSecurity from 'eslint-plugin-security';
import pluginReact from 'eslint-plugin-react';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import reactCompiler from 'eslint-plugin-react-compiler';
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
  // TypeScript Type-Aware Linting (scoped to .ts/.tsx files for performance)
  // Using projectService for faster linting vs traditional project config
  // -------------------------------------------------------------------------
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // -------------------------------------------------------------------------
  // TanStack Query Rules
  // -------------------------------------------------------------------------
  ...pluginQuery.configs['flat/recommended'],

  // -------------------------------------------------------------------------
  // Security Rules
  // -------------------------------------------------------------------------
  pluginSecurity.configs.recommended,

  // -------------------------------------------------------------------------
  // Prettier Integration (must be last to override conflicting rules)
  // -------------------------------------------------------------------------
  eslintPluginPrettierRecommended,

  // -------------------------------------------------------------------------
  // Main TypeScript + React Configuration
  // -------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        // projectService is the modern, performant approach for type-aware linting
        // It automatically discovers tsconfig.json without manual configuration
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': pluginImportX,
      react: pluginReact,
      'jsx-a11y': pluginJsxA11y,
      'react-compiler': reactCompiler,
    },
    rules: {
      // Spread recommended rules from plugins
      ...reactHooks.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,

      // -----------------------------------------------------------------------
      // React Compiler (React 19)
      // No manual useMemo/useCallback needed - compiler handles optimization
      // -----------------------------------------------------------------------
      'react-compiler/react-compiler': 'error',

      // -----------------------------------------------------------------------
      // React Refresh (Vite HMR compatibility)
      // -----------------------------------------------------------------------
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // -----------------------------------------------------------------------
      // React 19 / Modern Best Practices
      // -----------------------------------------------------------------------
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // We use TypeScript
      'react/jsx-no-target-blank': 'error', // Security: prevent reverse tabnabbing
      'react/jsx-key': ['error', { checkFragmentShorthand: true }], // Lists need keys

      // -----------------------------------------------------------------------
      // TypeScript Best Practices
      // -----------------------------------------------------------------------
      '@typescript-eslint/no-explicit-any': 'error', // Must use unknown or specific types
      '@typescript-eslint/no-floating-promises': 'error', // Must handle all promises
      '@typescript-eslint/require-await': 'error', // Async functions must use await
      '@typescript-eslint/prefer-promise-reject-errors': 'error', // Reject with Error objects
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
      'no-console': 'error', // Use NestJS Logger pattern or disable for specific lines if absolutely needed

      // -----------------------------------------------------------------------
      // Import Organization (builtin → external → internal → relative → types)
      // React imports come first, then other externals, then @/ alias internals
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
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'react-dom/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // -----------------------------------------------------------------------
      // Accessibility (WCAG 2.2 AA Compliance)
      // Critical structural rules as errors, interaction rules as off
      // (interaction rules have many false positives with custom components)
      // -----------------------------------------------------------------------
      // Critical - Must fix (errors)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': [
        'error',
        {
          handlers: [
            'onClick',
            'onMouseDown',
            'onMouseUp',
            'onKeyPress',
            'onKeyDown',
            'onKeyUp',
          ],
        },
      ],
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },

  // -------------------------------------------------------------------------
  // IDE/Editor Components - Relax type safety for third-party Monaco integration
  // Monaco editor types are complex and often require flexible typing
  // -------------------------------------------------------------------------
  {
    files: ['**/ide/**/*.{ts,tsx}', '**/code-editor/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off', // Monaco types can resolve to any
    },
  },

  // -------------------------------------------------------------------------
  // Pages with ReactMarkdown - Allow flexible typing for complex component props
  // ReactMarkdown's ComponentProps types are complex and often require type assertions
  // -------------------------------------------------------------------------
  {
    files: ['**/lesson-viewer-page.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },

  // -------------------------------------------------------------------------
  // Test Files - Relax strict rules for testing flexibility
  // -------------------------------------------------------------------------
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-console': 'off',
      'security/detect-object-injection': 'off',
    },
  },
];
