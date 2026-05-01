import type { BazaarAccountGateway, BazaarWindowBridge } from './types';

declare global {
  interface Window {
    Bazaar?: BazaarWindowBridge;
  }
}

export class BazaarBrowserAccountGateway implements BazaarAccountGateway {
  constructor(
    private readonly packageName: string,
    private readonly getWindow: () => Window | undefined = () =>
      typeof window === 'undefined' ? undefined : window,
  ) {}

  isAvailable(): boolean {
    return Boolean(this.getWindow()?.Bazaar?.getAccountId);
  }

  getAccountId(): string | null {
    const bazaar = this.getWindow()?.Bazaar;

    if (!bazaar?.getAccountId) {
      return null;
    }

    return bazaar.getAccountId(this.packageName) ?? null;
  }
}
