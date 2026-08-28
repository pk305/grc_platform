import { cookies } from 'next/headers';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/v1/';

const ME_QUERY = 'query Me { me { id } }';

export async function getServerAuthUser(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) return null;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ query: ME_QUERY }),
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.me ?? null;
  } catch {
    return null;
  }
}
