/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Variables por defecto que usa Vite:
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;

  // Si usas variables personalizadas que empiezan con VITE_,
  // decláralas aquí también (ejemplo):
  // readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
