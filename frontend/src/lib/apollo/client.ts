import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/v1/';

export function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: GRAPHQL_URL,
      // Session auth is cookie-based, so the sessionid cookie needs to ride along.
      credentials: 'include'
    }),
    cache: new InMemoryCache()
  });
}
