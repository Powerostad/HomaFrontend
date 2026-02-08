/**
 * PostHog Analytics Events
 * Typed functions for every custom business event in the Homa platform.
 *
 * Each function wraps posthog.capture() with a specific event name and typed properties,
 * providing a single source of truth for the event catalog.
 */

import { posthog } from '@/utils/posthog';
import type { User } from '@/types/auth';

// =============================================================================
// User Identification
// =============================================================================

/**
 * Identify a logged-in user in PostHog.
 * Links the anonymous session to a real user profile.
 */
export function identifyUser(user: User) {
  posthog.identify(user.id, {
    name: user.name,
    phone: user.phone,
    created_at: user.createdAt,
  });
}

/**
 * Reset user identity on logout.
 * Generates a new anonymous ID for subsequent events.
 */
export function resetUser() {
  posthog.reset();
}

// =============================================================================
// Try-On Funnel (Primary Conversion Path)
// =============================================================================

export function trackTryOnUploadViewed(props: { product_id: string; product_name: string }) {
  posthog.capture('tryon_upload_viewed', props);
}

export function trackFileSelected(props: { file_size: number; file_type: string; product_id: string }) {
  posthog.capture('tryon_file_selected', props);
}

export function trackSizeSelected(props: { product_id: string; size_code: string }) {
  posthog.capture('tryon_size_selected', props);
}

export function trackProcessingStarted(props: { product_id: string }) {
  posthog.capture('tryon_processing_started', props);
}

export function trackProcessingCompleted(props: { product_id: string; task_id: string; duration_ms: number }) {
  posthog.capture('tryon_processing_completed', props);
}

export function trackProcessingFailed(props: { product_id: string; error_message: string }) {
  posthog.capture('tryon_processing_failed', props);
}

export function trackResultViewed(props: { product_id: string; result_image_id?: number | null }) {
  posthog.capture('tryon_result_viewed', props);
}

export function trackResultAction(props: { action: string; product_id: string }) {
  posthog.capture('tryon_result_action', props);
}

// =============================================================================
// Purchase & Revenue
// =============================================================================

export function trackBuyButtonClicked(props: {
  product_id: string;
  source_context: string;
  shop_name?: string;
}) {
  posthog.capture('buy_button_clicked', props);
}

// =============================================================================
// Product & Store Browsing
// =============================================================================

export function trackProductViewed(props: {
  product_id: string;
  product_name: string;
  product_category?: string;
  shop_slug?: string;
}) {
  posthog.capture('product_viewed', props);
}

export function trackStoreViewed(props: { store_slug: string; store_name: string }) {
  posthog.capture('store_viewed', props);
}

export function trackTryOnCtaClicked(props: { product_id: string; source: string }) {
  posthog.capture('tryon_cta_clicked', props);
}

// =============================================================================
// Authentication
// =============================================================================

export function trackAuthEvent(props: {
  step: 'phone_entered' | 'otp_sent' | 'otp_verified' | 'login_success' | 'logout';
  source?: string;
}) {
  posthog.capture('auth_event', props);
}

// =============================================================================
// Feedback & Gallery
// =============================================================================

export function trackFeedbackSubmitted(props: {
  feedback_type: 'satisfied' | 'neutral' | 'dissatisfied' | null;
  slider_value: number;
  product_id?: string;
}) {
  posthog.capture('feedback_submitted', props);
}

export function trackGalleryEvent(props: { action: string; image_id?: number | null; source?: string }) {
  posthog.capture('gallery_event', props);
}

export function trackGalleryShared(props: {
  type: 'tryon' | 'studio';
  item_id: string;
  method: 'native_share' | 'clipboard';
}) {
  posthog.capture('gallery_shared', props);
}

export function trackSharedPageViewed(props: { type: 'tryon' | 'studio'; token: string }) {
  posthog.capture('shared_page_viewed', props);
}

// =============================================================================
// Studio Upload Funnel
// =============================================================================

export function trackStudioUploadViewed() {
  posthog.capture('studio_upload_viewed');
}

export function trackStudioFileSelected(props: { file_size: number; file_type: string }) {
  posthog.capture('studio_file_selected', props);
}

export function trackStudioPresetSelected(props: { preset_id: number; preset_name: string }) {
  posthog.capture('studio_preset_selected', props);
}

export function trackStudioUploadConfirmed(props: { session_id: string }) {
  posthog.capture('studio_upload_confirmed', props);
}

// =============================================================================
// Studio Processing
// =============================================================================

export function trackStudioProcessingStarted(props: { session_id: string }) {
  posthog.capture('studio_processing_started', props);
}

export function trackStudioProcessingCompleted(props: { session_id: string; duration_ms: number }) {
  posthog.capture('studio_processing_completed', props);
}

export function trackStudioProcessingFailed(props: { session_id: string; error_message: string }) {
  posthog.capture('studio_processing_failed', props);
}

// =============================================================================
// Studio Result Engagement
// =============================================================================

export function trackStudioResultViewed(props: { session_id: string; product_count: number; category_count: number }) {
  posthog.capture('studio_result_viewed', props);
}

export function trackStudioResultAction(props: { action: string; session_id: string }) {
  posthog.capture('studio_result_action', props);
}

export function trackStudioProductClicked(props: {
  session_id: string;
  product_id: string;
  product_name: string;
  category: string;
  is_top_pick: boolean;
}) {
  posthog.capture('studio_product_clicked', props);
}

// =============================================================================
// Studio Projects Dashboard
// =============================================================================

export function trackStudioProjectsViewed(props: { project_count: number }) {
  posthog.capture('studio_projects_viewed', props);
}

export function trackStudioProjectOpened(props: { session_id: string; session_status: string }) {
  posthog.capture('studio_project_opened', props);
}

// =============================================================================
// Errors
// =============================================================================

export function trackAppError(props: { error_type: string; error_message: string; page?: string }) {
  posthog.capture('app_error', props);
}
