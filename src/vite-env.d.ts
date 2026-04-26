/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_GOOGLE_ADS_ID?: string
  readonly VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
