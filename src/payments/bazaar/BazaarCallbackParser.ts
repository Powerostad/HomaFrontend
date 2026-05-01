import type { BazaarCallbackResult } from './types';

export class BazaarCallbackParser {
  parse(input: string | URL | URLSearchParams): BazaarCallbackResult {
    const params = this.toSearchParams(input);

    return {
      response: params.get('response'),
      purchaseToken: params.get('purchaseToken'),
      status: params.get('status'),
      sku: params.get('sku'),
    };
  }

  isPaymentLoginSuccess(result: BazaarCallbackResult): boolean {
    return result.status === 'payment' && result.response === 'ok' && Boolean(result.sku);
  }

  hasPurchaseToken(result: BazaarCallbackResult): boolean {
    return Boolean(result.purchaseToken);
  }

  private toSearchParams(input: string | URL | URLSearchParams): URLSearchParams {
    if (input instanceof URLSearchParams) {
      return input;
    }

    if (input instanceof URL) {
      return input.searchParams;
    }

    return new URL(input, window.location.origin).searchParams;
  }
}
