/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_POSTHOG_CAPTURE_LOCAL?: string;
  readonly VITE_POSTHOG_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
