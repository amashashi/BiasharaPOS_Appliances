import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'brand/**', 'design-handoff/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    // DESIGN_SYSTEM.md §8: no raw hex colors in feature code — tokens only.
    // packages/ui/src/tokens.ts is the single sanctioned home for hex values.
    files: ['apps/**/*.{ts,tsx}', 'packages/ui/src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
          message: 'Raw hex color — use tokens from @biashara/ui instead (DESIGN_SYSTEM.md §8).',
        },
        {
          selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]',
          message: 'Raw hex color — use tokens from @biashara/ui instead (DESIGN_SYSTEM.md §8).',
        },
      ],
    },
  },
);
