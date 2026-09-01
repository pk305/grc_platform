import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/v1/';

/** ws(s):// version of `GRAPHQL_URL`'s origin, at the WS-only route the
 * backend's ASGI router mounts separately from the HTTP GraphQL view (see
 * backend/core/asgi.py) — not derivable from the path, since it isn't the
 * same endpoint. */
const GRAPHQL_WS_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
  GRAPHQL_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws/graphql');

export function createApolloClient() {
  const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
    // Session auth is cookie-based, so the sessionid cookie needs to ride along.
    credentials: 'include'
  });

  // `ApolloProviderWrapper` is 'use client', but Next still renders a client
  // component's first pass on the server — guard explicitly rather than
  // assume a WebSocket global exists there. Subscriptions simply don't fire
  // during that pass; the browser render replaces this client anyway.
  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: GRAPHQL_WS_URL,
            // The session cookie already rides along on the WS handshake
            // itself (it's a same-origin HTTP upgrade request); nothing
            // extra to send.
            shouldRetry: () => true
          })
        )
      : null;

  const link = wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLink
      )
    : httpLink;

  return new ApolloClient({
    link,
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
