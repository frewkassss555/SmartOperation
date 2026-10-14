/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" replaces CoinGecko with deterministic demo series (src/lib/demoMarket.ts). */
  readonly VITE_DEMO_MARKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
