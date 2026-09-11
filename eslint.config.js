import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'android', 'ios', 'coverage', 'src/components/ui'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    // O núcleo não sabe onde está rodando: nada de DOM, React, Dexie ou transformers.js aqui.
    files: ['src/core/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'dexie',
                '@huggingface/*',
                '@capacitor/*',
                'zustand',
                '@/services/*',
                '@/features/*',
                '@/components/*',
              ],
              message:
                'src/core precisa permanecer TypeScript puro (regra de ouro da arquitetura). Receba dependências por parâmetro/porta.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'src/core não pode tocar no DOM.' },
        { name: 'document', message: 'src/core não pode tocar no DOM.' },
        { name: 'localStorage', message: 'src/core não pode tocar em storage.' },
        { name: 'indexedDB', message: 'src/core não pode tocar em storage.' },
        { name: 'fetch', message: 'src/core não pode fazer I/O.' },
      ],
    },
  },
  prettier,
)
