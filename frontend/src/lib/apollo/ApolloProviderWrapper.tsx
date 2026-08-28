'use client';

import { useState, type ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from './client';

export default function ApolloProviderWrapper({
  children
}: {
  children: ReactNode;
}) {
  const [client] = useState(() => createApolloClient());

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
