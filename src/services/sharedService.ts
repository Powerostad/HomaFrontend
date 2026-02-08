/**
 * Shared Service - اشتراک‌گذاری
 * Public API for fetching shared gallery items (no auth required)
 */

import { apiGet } from '@/utils/apiClient';
import type { SharedItem } from '@/types/shared';

/**
 * Fetch a shared gallery item by token (public, no auth)
 * GET /api/shared/{token}/
 */
export async function fetchSharedItem(
  token: string
): Promise<{ success: boolean; data?: SharedItem; error?: string }> {
  const response = await apiGet<SharedItem>(`/shared/${token}/`, undefined, {
    skipAuth: true,
  });

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data,
    };
  }

  return {
    success: false,
    error: response.error || 'این لینک معتبر نیست',
  };
}
