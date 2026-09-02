import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/v1/';

const GRAPHQL_WS_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
  GRAPHQL_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws/graphql');

export function createApolloClient() {
  const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
    credentials: 'include'
  });

  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: GRAPHQL_WS_URL,
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
          keyFields: ['key']
        },
        Query: {
          fields: {
            notifications: { merge: false }
          }
        }
      }
    })
  });
}
