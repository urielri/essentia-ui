import { describe, it, expect } from 'vitest'
import { sdRoundedBox, sdfAlpha } from '../sdf.js'

// Helper: rect 200×100 con radio 10
const W = 200
const H = 100
const R = 10
const hw = W / 2  // 100
const hh = H / 2  // 50

describe('sdRoundedBox — puntos interiores', () => {
  it('centro del rect → distancia negativa (lejos del borde)', () => {
    const d = sdRoundedBox(0, 0, hw, hh, R)
    expect(d).toBeLessThan(0)
    // La distancia al borde más cercano desde el centro es -hh = -50
    // (borde recto superior/inferior — el radio solo afecta esquinas, no lados)
    expect(d).toBeCloseTo(-50)
  })

  it('punto cerca del borde derecho pero dentro → distancia negativa', () => {
    const d = sdRoundedBox(80, 0, hw, hh, R)
    expect(d).toBeLessThan(0)
  })

  it('punto cerca de la esquina interior redondeada → negativa', () => {
    // (85, 35) está dentro del área de radio
    const d = sdRoundedBox(85, 35, hw, hh, R)
    expect(d).toBeLessThan(0)
  })
})

describe('sdRoundedBox — puntos sobre el borde', () => {
  it('borde derecho (fuera del área de esquina) → ≈ 0', () => {
    // (100, 0) = borde derecho exacto, lejos de esquinas
    const d = sdRoundedBox(hw, 0, hw, hh, R)
    expect(d).toBeCloseTo(0)
  })

  it('borde superior (fuera del área de esquina) → ≈ 0', () => {
    const d = sdRoundedBox(0, hh, hw, hh, R)
    expect(d).toBeCloseTo(0)
  })

  it('borde de la esquina redondeada → ≈ 0', () => {
    // El borde redondeado está a radio R del centro de la esquina interior (90, 40)
    // Un punto sobre la curva a 45° desde ese centro: (90 + R/√2, 40 + R/√2)
    const angle = Math.PI / 4
    const bx = (hw - R) + R * Math.cos(angle)  // ≈ 97.07
    const by = (hh - R) + R * Math.sin(angle)  // ≈ 47.07
    const d = sdRoundedBox(bx, by, hw, hh, R)
    expect(d).toBeCloseTo(0, 4)
  })
})

describe('sdRoundedBox — puntos exteriores', () => {
  it('fuera del borde derecho → positivo', () => {
    const d = sdRoundedBox(hw + 5, 0, hw, hh, R)
    expect(d).toBeCloseTo(5)
  })

  it('fuera del borde superior → positivo', () => {
    const d = sdRoundedBox(0, hh + 8, hw, hh, R)
    expect(d).toBeCloseTo(8)
  })

  it('fuera de la esquina recortada → positivo y proporcional', () => {
    // Extremo de la esquina (hw, hh) antes del redondeo
    const d = sdRoundedBox(hw, hh, hw, hh, R)
    // d = sqrt((R²+R²)) - R = R*(√2 - 1) ≈ 4.14
    expect(d).toBeCloseTo(R * (Math.SQRT2 - 1), 3)
  })

  it('distancia crece linealmente fuera del borde recto', () => {
    const d1 = sdRoundedBox(hw + 1, 0, hw, hh, R)
    const d2 = sdRoundedBox(hw + 2, 0, hw, hh, R)
    const d5 = sdRoundedBox(hw + 5, 0, hw, hh, R)
    expect(d1).toBeCloseTo(1)
    expect(d2).toBeCloseTo(2)
    expect(d5).toBeCloseTo(5)
  })
})

describe('sdRoundedBox — radio 0 (rect perfecto)', () => {
  it('esquina exacta → d = 0', () => {
    const d = sdRoundedBox(hw, hh, hw, hh, 0)
    expect(d).toBeCloseTo(0)
  })

  it('fuera de la esquina a distancia d → d euclidiana', () => {
    const d = sdRoundedBox(hw + 3, hh + 4, hw, hh, 0)
    expect(d).toBeCloseTo(5) // 3-4-5
  })
})

describe('sdRoundedBox — simetría', () => {
  it('la SDF es simétrica en los 4 cuadrantes', () => {
    const px = 60
    const py = 30
    const d1 = sdRoundedBox(px, py, hw, hh, R)
    const d2 = sdRoundedBox(-px, py, hw, hh, R)
    const d3 = sdRoundedBox(px, -py, hw, hh, R)
    const d4 = sdRoundedBox(-px, -py, hw, hh, R)
    expect(d1).toBeCloseTo(d2)
    expect(d1).toBeCloseTo(d3)
    expect(d1).toBeCloseTo(d4)
  })
})

describe('sdfAlpha', () => {
  it('d muy negativo (interior) → alpha ≈ 1', () => {
    expect(sdfAlpha(-10, 1.5)).toBeCloseTo(1)
  })

  it('d muy positivo (exterior) → alpha ≈ 0', () => {
    expect(sdfAlpha(10, 1.5)).toBeCloseTo(0)
  })

  it('d = 0 (borde exacto) → alpha = 0.5', () => {
    expect(sdfAlpha(0, 1.5)).toBeCloseTo(0.5)
  })

  it('alpha está siempre en [0, 1]', () => {
    for (const d of [-100, -5, -1, 0, 1, 5, 100]) {
      const a = sdfAlpha(d, 1.5)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThanOrEqual(1)
    }
  })

  it('mayor softness → transición más suave (menor pendiente en d=0)', () => {
    // Con softness grande, alpha a d=1 sigue siendo alto
    const aSharp = sdfAlpha(1, 0.5)
    const aSoft = sdfAlpha(1, 3.0)
    expect(aSoft).toBeGreaterThan(aSharp)
  })
})
