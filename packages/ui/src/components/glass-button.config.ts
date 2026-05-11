/**
 * Variantes visuales del `<GlassButton>`.
 * Cada variante mapea a un conjunto coherente de Glass + Text defaults.
 */
export type GlassButtonVariant = 'primary' | 'secondary' | 'ghost'

/**
 * Estado resuelto que el componente Svelte pasa a `<Glass>` y `<Text>`.
 * Función pura: tests pueden validarla sin renderizar.
 */
export type GlassButtonState = {
  glass: {
    tint: string
    tintOpacity: number
    fresnelStrength: number
    blur: number
    ior: number
    distortion: number
  }
  text: {
    color: string
  }
  /** Si el botón debe procesar clicks (false si disabled). */
  interactive: boolean
  /** Cursor CSS a aplicar via el bridge DOM de Glass. */
  cursor: 'pointer' | 'not-allowed'
}

/**
 * Inputs para resolver el estado del botón.
 * Todos opcionales — los defaults se aplican adentro.
 */
export type GlassButtonStateInput = {
  variant?: GlassButtonVariant
  disabled?: boolean
}

/**
 * Configuración por variante.
 * Mantener como tabla de datos para que sea trivialmente testeable y
 * extensible (agregar variantes nuevas = una línea acá).
 */
const VARIANT_DEFAULTS: Record<GlassButtonVariant, GlassButtonState['glass'] & { textColor: string }> = {
  primary: {
    tint: '#ffffff',
    tintOpacity: 0.18,
    fresnelStrength: 0.12,
    blur: 4,
    ior: 1.4,
    distortion: 0.08,
    textColor: '#ffffff',
  },
  secondary: {
    tint: '#ffffff',
    tintOpacity: 0.08,
    fresnelStrength: 0.08,
    blur: 2,
    ior: 1.35,
    distortion: 0.05,
    textColor: '#ffffff',
  },
  ghost: {
    tint: '#ffffff',
    tintOpacity: 0,
    fresnelStrength: 0.06,
    blur: 0,
    ior: 1.3,
    distortion: 0.03,
    textColor: '#ffffff',
  },
}

/** Color de texto cuando el botón está deshabilitado. */
const DISABLED_TEXT_COLOR = '#777777'

/** Multiplicador de tintOpacity cuando el botón está deshabilitado. */
const DISABLED_TINT_FACTOR = 0.3

/**
 * Resuelve el estado del botón a partir de los inputs.
 *
 * Reglas:
 * - Variante por defecto: `'primary'`.
 * - `disabled: true` desactiva `interactive`, cambia el color del texto a
 *   un gris apagado y atenúa el tintOpacity del Glass. Es la señal visual
 *   estándar de un control no-clickeable.
 */
export function buildGlassButtonState(input: GlassButtonStateInput = {}): GlassButtonState {
  const variant = input.variant ?? 'primary'
  const disabled = input.disabled ?? false

  const defaults = VARIANT_DEFAULTS[variant]

  return {
    glass: {
      tint: defaults.tint,
      tintOpacity: disabled
        ? defaults.tintOpacity * DISABLED_TINT_FACTOR
        : defaults.tintOpacity,
      fresnelStrength: defaults.fresnelStrength,
      blur: defaults.blur,
      ior: defaults.ior,
      distortion: defaults.distortion,
    },
    text: {
      color: disabled ? DISABLED_TEXT_COLOR : defaults.textColor,
    },
    interactive: !disabled,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
