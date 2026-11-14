/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Free API key for the CARTO base maps, see README. Set in .env.local or as a CI variable. */
  readonly VITE_CARTO_API_KEY?: string
  /** Operator shown in the imprint, see README. Kept out of the repository on purpose. */
  readonly VITE_IMPRINT_NAME?: string
  readonly VITE_IMPRINT_STREET?: string
  readonly VITE_IMPRINT_CITY?: string
  readonly VITE_IMPRINT_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
