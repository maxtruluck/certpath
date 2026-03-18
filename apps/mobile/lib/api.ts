import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const { headers: extraHeaders, ...rest } = opts;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
    },
  });

  if (res.status === 401) {
    // Try refreshing the session once
    const { error } = await supabase.auth.refreshSession();
    if (error) throw new Error('Session expired');

    const { data: { session: newSession } } = await supabase.auth.getSession();
    if (!newSession) throw new Error('Session expired');

    const retryRes = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newSession.access_token}`,
        ...extraHeaders,
      },
    });

    if (!retryRes.ok) {
      const body = await retryRes.json().catch(() => ({}));
      throw new Error(body.error || `API error ${retryRes.status}`);
    }
    return retryRes.json();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
}
