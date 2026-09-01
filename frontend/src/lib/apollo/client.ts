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
    cache: new InMemoryCache({
      typePolicies: {
        NotificationType: {
          // Alerts are derived server-side and carry no id; `key` identifies
          // one, so normalising on it lets the cache replace the list — which
          // clearing an alert does — without warning about lost data.
          keyFields: ['key']
        },
        Query: {
          fields: {
            // A fresh list always supersedes the cached one: an alert that is
            // gone is gone, so merging the two would resurrect it.
            notifications: { merge: false }
          }
        }
      }
    })
  });
}
