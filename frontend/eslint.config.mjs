import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierRecommended,
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'no-console': 'off'
    }
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'webpack/**',
      'src/gql/graphql-types.ts',
      'src/features/**/__generated__/**'
    ]
  }
];

export default eslintConfig;
