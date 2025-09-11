module.exports = {
  root: true,
  env: { 
    node: true, 
    es2020: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:node/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', 'coverage', 'prisma/migrations'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'node'],
  settings: {
    node: {
      tryExtensions: ['.js', '.json', '.ts'],
      resolvePaths: ['node_modules/@types']
    }
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-namespace': 'error',
    
    // Node.js specific rules
    'node/no-unsupported-features/es-syntax': 'off', // Allow ES modules
    'node/no-missing-import': 'off', // TypeScript handles this
    'node/no-unpublished-import': 'off', // Allow dev dependencies in tests
    'node/no-extraneous-import': 'error',
    
    // General ESLint rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-case-declarations': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  },
}