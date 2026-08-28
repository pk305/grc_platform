import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../backend/schema.graphql',
  documents: 'src/features/**/*.graphql',
  generates: {
    // Generate types next to each .graphql file
    'src/features/': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.generated.tsx',
        baseTypesPath: '../gql/graphql-types.ts',
        folder: '__generated__'
      },
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false
      }
    },

    // Generate base types file
    'src/gql/graphql-types.ts': {
      plugins: ['typescript'],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false
      }
    }
  }
};

export default config;
