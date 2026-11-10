export function stageKey(name: string): string {
  if (/search|retriev|embedding/.test(name)) return 'search';
  if (/server_scene_design/.test(name)) return 'design';
  if (/scene_analysis|opening_scene/.test(name)) return 'analysis';
  if (/(?:compact_)?image[-_]first[-_]extract|flow-timing-\d+-extract-/.test(name)) return 'extraction';
  if (/(?:compact_)?image[-_]first[-_]match|flow-timing-\d+-match-/.test(name)) return 'matching';
  if (/image|render/.test(name)) return 'image';
  if (/validation/.test(name)) return 'validation';
  if (/text|refine|finalize/.test(name)) return 'conversation';
  return 'other';
}

export function durationParts(milliseconds: number | null | undefined) {
  if (milliseconds == null || !Number.isFinite(milliseconds)) return null;
  const seconds = Math.max(0, milliseconds) / 1000;
  const total = seconds >= 60 ? Math.round(seconds) : Number(seconds.toFixed(1));
  return { minutes: Math.floor(total / 60), seconds: Number((total % 60).toFixed(1)) };
}
