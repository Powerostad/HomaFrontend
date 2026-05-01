import type { PaymentProvider, PaymentRequest, PaymentStartResult } from '../types';
import { BazaarDeepLinkBuilder } from './BazaarDeepLinkBuilder';
import type { BazaarAccountGateway, BazaarRedirector } from './types';

export class BazaarEmbeddedPaymentProvider implements PaymentProvider {
  readonly market = 'bazaar';

  constructor(
    private readonly accountGateway: BazaarAccountGateway,
    private readonly deepLinkBuilder: BazaarDeepLinkBuilder,
    private readonly redirector: BazaarRedirector,
  ) {}

  startPayment(request: PaymentRequest): PaymentStartResult {
    if (!request.sku) {
      return {
        status: 'unavailable',
        market: this.market,
        reason: 'Bazaar payment requires a SKU.',
      };
    }

    const accountId = this.accountGateway.getAccountId();
    const url = accountId
      ? this.deepLinkBuilder.buildPaymentLink(request.sku, request.redirectUrl)
      : this.deepLinkBuilder.buildLoginLink(request.sku, true);

    this.redirector.redirect(url);

    return {
      status: 'redirected',
      market: this.market,
      url,
    };
  }
}
