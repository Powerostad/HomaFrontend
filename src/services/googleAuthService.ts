import { transformBackendUser, type LoginResponse, type LoginResult } from '@/types/auth';
import { apiGet, apiPost } from '@/utils/apiClient';

export interface GoogleChallenge {
  enabled: boolean;
  client_id?: string;
  nonce?: string;
}

const requestOptions = {
  skipAuth: true,
  skipRetryOn401: true,
  credentials: 'include' as const,
  cache: 'no-store' as const,
};

export async function startGoogleLogin(): Promise<GoogleChallenge> {
  const response = await apiGet<GoogleChallenge>('/users/google/start/', undefined, requestOptions);
  if (!response.success || !response.data) throw new Error('google_unavailable');
  return response.data;
}

export async function loginWithGoogle(credential: string): Promise<LoginResult> {
  const response = await apiPost<LoginResponse>('/users/google/login/', { credential }, requestOptions);
  if (response.success && response.data) {
    return {
      success: true,
      user: transformBackendUser(response.data.user),
      tokens: response.data.tokens,
    };
  }
  return { success: false, error: 'google_login_failed' };
}
