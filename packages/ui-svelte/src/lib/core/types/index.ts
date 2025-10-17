// Definir el tipo Sizes basado en el uso común de espaciado (sm, m, lg, etc.)
export type Sizes = "xs" | "sm" | "m" | "lg" | "xl";

export interface BrickProps {
  /** Espaciado vertical u horizontal entre elementos. */
  space?: Sizes;
  /** Clases CSS adicionales. */
  className?: string;
  // Puedes añadir aquí otros atributos HTML genéricos si los necesitas,
  // aunque Svelte los pasa automáticamente con `$$restProps`.
}
