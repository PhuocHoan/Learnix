// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import security from 'eslint-plugin-security';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js',
    ],
  },

  // Base configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  eslintPluginPrettierRecommended,

  // Main configuration
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2025,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      security,
    },
    rules: {
      // ═══════════════════════════════════════════════════════════════════
      // TypeScript Best Practices
      // ═══════════════════════════════════════════════════════════════════
      '@typescript-eslint/no-explicit-any': 'warn',
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
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off', // NestJS uses method references in decorators
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public', // NestJS convention: no explicit 'public'
          overrides: {
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'method',
          format: ['camelCase'],
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE', 'snake_case'], // Allow snake_case for OAuth/API compatibility
          leadingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Allow any format for object literals (API responses)
        },
      ],
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // ═══════════════════════════════════════════════════════════════════
      // NestJS Best Practices
      // ═══════════════════════════════════════════════════════════════════
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['constructors'], // Allow empty constructors for DI
        },
      ],
      '@typescript-eslint/no-inferrable-types': [
        'error',
        {
          ignoreParameters: true, // Allow explicit types on parameters for clarity
          ignoreProperties: true,
        },
      ],

      // ═══════════════════════════════════════════════════════════════════
      // Import Organization
      // ═══════════════════════════════════════════════════════════════════
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
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
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['@nestjs'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'off', // TypeScript handles this
      'import-x/no-cycle': 'warn',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-default-export': 'off', // NestJS uses default exports for modules

      // ═══════════════════════════════════════════════════════════════════
      // Security Best Practices (OWASP)
      // ═══════════════════════════════════════════════════════════════════
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',

      // ═══════════════════════════════════════════════════════════════════
      // General Best Practices
      // ═══════════════════════════════════════════════════════════════════
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-param-reassign': ['error', { props: false }],
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'warn',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-useless-computed-key': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': [
        'warn',
        {
          array: false,
          object: true,
        },
      ],
      'spaced-comment': ['error', 'always'],
      'no-implicit-coercion': 'error',
      'no-return-assign': 'error',
      'no-throw-literal': 'off', // TypeScript handles this
      '@typescript-eslint/only-throw-error': 'error',
      'require-await': 'off',
      '@typescript-eslint/require-await': 'warn',

      // ═══════════════════════════════════════════════════════════════════
      // Prettier Integration
      // ═══════════════════════════════════════════════════════════════════
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          singleQuote: true,
          trailingComma: 'all',
          tabWidth: 2,
          semi: true,
          printWidth: 80,
        },
      ],
    },
  },

  // Test files configuration (relaxed rules)
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.unit-spec.ts',
      '**/*.e2e-spec.ts',
      '**/test/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'no-console': 'off',
    },
  },

  // DTO files configuration (special handling for class-validator)
  {
    files: ['**/dto/**/*.ts', '**/*.dto.ts'],
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off', // Allow explicit types for decorators
    },
  },

  // Entity files configuration (special handling for TypeORM)
  {
    files: ['**/entities/**/*.ts', '**/*.entity.ts'],
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off', // Allow explicit types for decorators
      'import-x/no-cycle': 'off', // TypeORM entities often have circular references
    },
  },

  // Seed and script files configuration (allow console.log for CLI output)
  {
    files: ['**/seed.ts', '**/seed/**/*.ts', '**/scripts/**/*.ts'],
    rules: {
      'no-console': 'off', // Seed and scripts use console for CLI output
    },
  },

  // Upload module files - filesystem access with validated paths
  // The security plugin cannot understand runtime path validation,
  // but these files implement proper path traversal prevention
  {
    files: ['**/upload/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
);
