import { describe, it, expect } from 'vitest'
import { buildGlassButtonState } from '../glass-button.config.js'

describe('buildGlassButtonState — defaults', () => {
  it('usa la variante "primary" cuando no se especifica', () => {
    const state = buildGlassButtonState({})
    expect(state.glass.tintOpacity).toBe(0.18)
    expect(state.glass.fresnelStrength).toBe(0.12)
    expect(state.glass.blur).toBe(4)
    expect(state.glass.ior).toBe(1.4)
    expect(state.glass.distortion).toBe(0.08)
  })

  it('acepta input vacío (objeto vacío equivale a defaults)', () => {
    const state = buildGlassButtonState()
    expect(state.glass.tintOpacity).toBe(0.18)
    expect(state.interactive).toBe(true)
  })

  it('por defecto el botón es interactivo y cursor=pointer', () => {
    const state = buildGlassButtonState()
    expect(state.interactive).toBe(true)
    expect(state.cursor).toBe('pointer')
  })

  it('por defecto el text color es blanco', () => {
    const state = buildGlassButtonState()
    expect(state.text.color).toBe('#ffffff')
  })
})

describe('buildGlassButtonState — variantes', () => {
  it('variant=secondary atenúa tintOpacity, blur y distorsión', () => {
    const secondary = buildGlassButtonState({ variant: 'secondary' })
    const primary = buildGlassButtonState({ variant: 'primary' })

    expect(secondary.glass.tintOpacity).toBeLessThan(primary.glass.tintOpacity)
    expect(secondary.glass.blur).toBeLessThan(primary.glass.blur)
    expect(secondary.glass.distortion).toBeLessThan(primary.glass.distortion)
  })

  it('variant=ghost tiene tintOpacity=0 y blur=0', () => {
    const state = buildGlassButtonState({ variant: 'ghost' })
    expect(state.glass.tintOpacity).toBe(0)
    expect(state.glass.blur).toBe(0)
  })

  it('todas las variantes mantienen tint blanco', () => {
    expect(buildGlassButtonState({ variant: 'primary' }).glass.tint).toBe('#ffffff')
    expect(buildGlassButtonState({ variant: 'secondary' }).glass.tint).toBe('#ffffff')
    expect(buildGlassButtonState({ variant: 'ghost' }).glass.tint).toBe('#ffffff')
  })

  it('todas las variantes son interactivas cuando no están disabled', () => {
    expect(buildGlassButtonState({ variant: 'primary' }).interactive).toBe(true)
    expect(buildGlassButtonState({ variant: 'secondary' }).interactive).toBe(true)
    expect(buildGlassButtonState({ variant: 'ghost' }).interactive).toBe(true)
  })
})

describe('buildGlassButtonState — disabled', () => {
  it('disabled=true marca el botón como no interactivo', () => {
    const state = buildGlassButtonState({ disabled: true })
    expect(state.interactive).toBe(false)
  })

  it('disabled=true cambia cursor a not-allowed', () => {
    const state = buildGlassButtonState({ disabled: true })
    expect(state.cursor).toBe('not-allowed')
  })

  it('disabled=true cambia el color del texto a un gris apagado', () => {
    const state = buildGlassButtonState({ disabled: true })
    expect(state.text.color).toBe('#777777')
  })

  it('disabled=true atenúa el tintOpacity', () => {
    const enabled = buildGlassButtonState({ variant: 'primary', disabled: false })
    const disabled = buildGlassButtonState({ variant: 'primary', disabled: true })

    expect(disabled.glass.tintOpacity).toBeLessThan(enabled.glass.tintOpacity)
    expect(disabled.glass.tintOpacity).toBeCloseTo(enabled.glass.tintOpacity * 0.3)
  })

  it('disabled=true sobre ghost mantiene tintOpacity en 0 (0 * factor = 0)', () => {
    const state = buildGlassButtonState({ variant: 'ghost', disabled: true })
    expect(state.glass.tintOpacity).toBe(0)
  })

  it('disabled=false es equivalente a omitir disabled', () => {
    const explicit = buildGlassButtonState({ variant: 'secondary', disabled: false })
    const implicit = buildGlassButtonState({ variant: 'secondary' })

    expect(explicit).toEqual(implicit)
  })
})

describe('buildGlassButtonState — combinaciones', () => {
  it('variant + disabled se componen correctamente', () => {
    const state = buildGlassButtonState({ variant: 'ghost', disabled: true })

    expect(state.glass.tintOpacity).toBe(0) // ghost base es 0
    expect(state.glass.fresnelStrength).toBe(0.06) // mantiene fresnel de ghost
    expect(state.interactive).toBe(false)
    expect(state.cursor).toBe('not-allowed')
    expect(state.text.color).toBe('#777777')
  })

  it('cada call devuelve un objeto nuevo (sin estado compartido)', () => {
    const a = buildGlassButtonState({ variant: 'primary' })
    const b = buildGlassButtonState({ variant: 'primary' })
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})
