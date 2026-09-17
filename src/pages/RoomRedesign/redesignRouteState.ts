const REDESIGN_SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRedesignSessionId(value: string | undefined): value is string {
  return Boolean(value && REDESIGN_SESSION_ID.test(value));
}

export function removeLegacyRedesignParams(params: URLSearchParams): URLSearchParams {
  const cleaned = new URLSearchParams(params);
  cleaned.delete('s');
  cleaned.delete('phase');
  return cleaned;
}

export function shouldCanonicalizeSessionPath({
  hasIntakePayload,
  routeSessionId,
  chatSessionId,
  previousRouteSessionId,
}: {
  hasIntakePayload: boolean;
  routeSessionId: string | undefined;
  chatSessionId: string | null;
  previousRouteSessionId: string | undefined;
}): boolean {
  return hasIntakePayload && Boolean(chatSessionId) && !routeSessionId && !previousRouteSessionId;
}

export function shouldResetRedesignView(
  previousRouteSessionId: string | undefined,
  nextRouteSessionId: string | undefined,
): boolean {
  return previousRouteSessionId !== nextRouteSessionId;
}

export function shouldSeedIntake({
  didConsumeIntake,
  hasIntakePayload,
  routeSessionId,
  messageCount,
}: {
  didConsumeIntake: boolean;
  hasIntakePayload: boolean;
  routeSessionId: string | undefined;
  messageCount: number;
}): boolean {
  return !didConsumeIntake && hasIntakePayload && !routeSessionId && messageCount === 0;
}
