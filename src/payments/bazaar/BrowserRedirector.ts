import type { BazaarRedirector } from './types';

export class BrowserRedirector implements BazaarRedirector {
  constructor(
    private readonly getWindow: () => Window | undefined = () =>
      typeof window === 'undefined' ? undefined : window,
  ) {}

  redirect(url: string): void {
    this.getWindow()?.location.replace(url);
  }
}
