import { appConfig } from '@/config/appConfig';
import { BazaarBrowserAccountGateway } from './BazaarBrowserAccountGateway';
import { BazaarDeepLinkBuilder } from './BazaarDeepLinkBuilder';
import { BazaarEmbeddedPaymentProvider } from './BazaarEmbeddedPaymentProvider';
import { BrowserRedirector } from './BrowserRedirector';
import type { BazaarPaymentConfig } from './types';

export function getBazaarPaymentConfig(): BazaarPaymentConfig | null {
  const packageName = appConfig.bazaarPackageName.trim();
  const dealerPackageName = appConfig.bazaarDealerPackageName.trim();
  const redirectUrl = appConfig.bazaarRedirectUrl.trim();

  if (!packageName || !dealerPackageName || !redirectUrl) {
    return null;
  }

  return {
    packageName,
    dealerPackageName,
    redirectUrl,
    permissionScope: '1',
  };
}

export function createBazaarPaymentProvider(): BazaarEmbeddedPaymentProvider | null {
  const config = getBazaarPaymentConfig();

  if (!config) {
    return null;
  }

  return new BazaarEmbeddedPaymentProvider(
    new BazaarBrowserAccountGateway(config.packageName),
    new BazaarDeepLinkBuilder(config),
    new BrowserRedirector(),
  );
}
