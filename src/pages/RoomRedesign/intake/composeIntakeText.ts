/**
 * Only the user's written note is a user message. Explicit form selections
 * travel separately as structured preferences; never invent a design request.
 */
import type { HomaIntakePayload } from './intakeTypes';

export function composeIntakeText(payload: HomaIntakePayload): string {
  return payload.userNote?.trim() || '';
}
