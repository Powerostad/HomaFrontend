/**
 * Compose the first chat-turn text from the structured intake payload.
 *
 * The redesign chat is conversational (Persian text + an image). This mirrors
 * the existing `scopeInstruction()` idiom in RoomRedesignPage: turn the optional
 * structured context (room type, goals, note) into a single natural Persian
 * message that seeds the analysis. The photo travels separately as the image.
 */
import { GOALS, ROOM_TYPES, type HomaIntakePayload } from './intakeTypes';

export function composeIntakeText(payload: HomaIntakePayload): string {
  const parts: string[] = [];

  const note = payload.userNote?.trim();
  if (note) parts.push(note);

  // Room type — "مطمئن نیستم" carries no signal, so we skip it.
  if (payload.roomType && payload.roomType !== 'not_sure') {
    const label = ROOM_TYPES.find((r) => r.value === payload.roomType)?.label;
    if (label) parts.push(`این فضا ${label} است.`);
  }

  // Goals — "فقط تحلیل کن" is the default behaviour, not a focus instruction.
  const goalLabels = payload.goals
    .filter((g) => g !== 'analyze_only')
    .map((g) => GOALS.find((x) => x.value === g)?.label)
    .filter((l): l is string => Boolean(l));
  if (goalLabels.length > 0) {
    parts.push(`دوست دارم نتیجه روی این موارد تمرکز کنه: ${goalLabels.join('، ')}.`);
  }

  // Nothing meaningful provided (e.g. only "فقط تحلیل کن") → a plain analysis ask.
  if (parts.length === 0) {
    return 'این فضا رو برام تحلیل کن و پیشنهاد بده.';
  }

  return parts.join('\n\n');
}
