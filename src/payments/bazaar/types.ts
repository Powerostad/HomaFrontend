export interface BazaarPaymentConfig {
  packageName: string;
  dealerPackageName: string;
  redirectUrl: string;
  permissionScope: string;
}

export interface BazaarCallbackResult {
  response: string | null;
  purchaseToken: string | null;
  status: string | null;
  sku: string | null;
}

export interface BazaarWindowBridge {
  getAccountId: (packageName: string) => string | null | undefined;
  back?: () => void;
}

export interface BazaarAccountGateway {
  getAccountId: () => string | null;
  isAvailable: () => boolean;
}

export interface BazaarRedirector {
  redirect: (url: string) => void;
}
