/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_IMAGE_PROCESSING_TIMEOUT: string;
  readonly VITE_PUBLIC_POSTHOG_KEY: string;
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
  readonly VITE_AUTH_MODE: string;
  readonly VITE_ENABLE_POSTHOG_IN_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
