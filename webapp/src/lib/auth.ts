'use client';

const AUTH_KEY = 'contacts_auth';

export interface AuthCredentials {
  username: string;
  password: string;
}

export function getStoredCredentials(): AuthCredentials | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function storeCredentials(credentials: AuthCredentials): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
}

export function clearCredentials(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthHeader(): string | null {
  const creds = getStoredCredentials();
  if (!creds) return null;

  const encoded = btoa(`${creds.username}:${creds.password}`);
  return `Basic ${encoded}`;
}

export function isAuthenticated(): boolean {
  return getStoredCredentials() !== null;
}

export function handleSessionExpired(): void {
  clearCredentials();
  // Redirect to login - works in browser context
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
