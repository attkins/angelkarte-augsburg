/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Free API key for the CARTO base maps, see README. Set in .env.local or as a CI variable. */
  readonly VITE_CARTO_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
