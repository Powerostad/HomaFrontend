import type { BazaarPaymentConfig } from './types';

export class BazaarDeepLinkBuilder {
  constructor(private readonly config: BazaarPaymentConfig) {}

  buildLoginLink(sku?: string, paymentAfterLogin = false): string {
    const redirectUrl = new URL(this.config.redirectUrl);

    if (paymentAfterLogin) {
      redirectUrl.searchParams.set('status', 'payment');
    }

    if (sku) {
      redirectUrl.searchParams.set('sku', sku);
    }

    const link = new URL('bazaar://inapplogin');
    link.searchParams.set('redirectUrl', redirectUrl.toString());
    link.searchParams.set('packageName', this.config.packageName);
    link.searchParams.set('permissionScope', this.config.permissionScope);

    return link.toString();
  }

  buildPaymentLink(sku: string, redirectUrl = this.config.redirectUrl): string {
    const link = new URL('bazaar://in_app');
    link.searchParams.set('redirectUrl', redirectUrl);
    link.searchParams.set('sku', sku);
    link.searchParams.set('dealerPackageName', this.config.dealerPackageName);

    return link.toString();
  }
}
