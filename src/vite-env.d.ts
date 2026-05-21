/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_IMAGE_PROCESSING_TIMEOUT: string;
  readonly VITE_UMAMI_SRC: string;
  readonly VITE_UMAMI_WEBSITE_ID: string;
  readonly VITE_AUTH_MODE: string;
  readonly VITE_ENABLE_UMAMI_IN_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
