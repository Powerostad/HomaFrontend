export function alternativePriceBand(price: number, unknown: boolean | undefined, mainPrice: number, mainUnknown: boolean | undefined): 'economic' | 'similar' | 'higher' | null {
  if (unknown || mainUnknown || !Number.isFinite(price) || !Number.isFinite(mainPrice) || price <= 0 || mainPrice <= 0) return null;
  const ratio = price / mainPrice;
  return ratio < .85 ? 'economic' : ratio < 1.15 ? 'similar' : 'higher';
}
