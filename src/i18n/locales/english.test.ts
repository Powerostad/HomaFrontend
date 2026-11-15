import { describe, expect, it } from 'vitest';
import fa from './fa.json';
import en from './en.json';
import informationFa from './information.fa.json';
import informationEn from './information.en.json';

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  return Object.assign({}, ...Object.entries(value as Record<string, unknown>)
    .map(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key)));
}

describe('English translation coverage', () => {
  for (const [name, persian, english] of [['site', fa, en], ['information', informationFa, informationEn]] as const) {
    it(`covers all ${name} Persian keys and preserves interpolation variables`, () => {
      const source = flatten(persian);
      const target = flatten(english);
      for (const [key, text] of Object.entries(source)) {
        expect(target[key], key).toBeTruthy();
        expect((target[key].match(/{{[^}]+}}/g) || []).sort(), key)
          .toEqual((text.match(/{{[^}]+}}/g) || []).sort());
      }
    });
  }
});
