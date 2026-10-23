import { describe, it, expect } from 'vitest'
import { Group, Mesh, Object3D, Scene } from 'three'
import {
  hideForBackgroundCapture,
  restoreBackgroundCapture,
} from '../background-capture.js'

function meshAt(z: number): Mesh {
  const m = new Mesh()
  m.position.z = z
  return m
}

function setup(...objects: Object3D[]): Scene {
  const scene = new Scene()
  scene.add(...objects)
  scene.updateMatrixWorld()
  return scene
}

describe('hideForBackgroundCapture', () => {
  it('oculta los Glass registrados', () => {
    const glass = meshAt(1)
    const scene = setup(glass)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)

    expect(glass.visible).toBe(false)
    expect(hidden).toContain(glass)
  })

  it('oculta renderables delante del Glass más profundo', () => {
    const glass = meshAt(1)
    const text = meshAt(2)
    const scene = setup(glass, text)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)

    expect(text.visible).toBe(false)
  })

  it('mantiene visibles los renderables detrás o a la misma z del Glass', () => {
    const glass = meshAt(1)
    const behind = meshAt(0)
    const sameZ = meshAt(1)
    const scene = setup(glass, behind, sameZ)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)

    expect(behind.visible).toBe(true)
    expect(sameZ.visible).toBe(true)
  })

  it('usa la z de mundo (incluye transform del padre)', () => {
    const glass = meshAt(1)
    const parent = new Group()
    parent.position.z = 2
    const child = meshAt(0)
    parent.add(child)
    const scene = setup(glass, parent)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)

    expect(child.visible).toBe(false)
  })

  it('toma como umbral el Glass más profundo', () => {
    const back = meshAt(1)
    const front = meshAt(3)
    const between = meshAt(2)
    const scene = setup(back, front, between)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [back, front], hidden)

    expect(between.visible).toBe(false)
  })

  it('ignora Glass invisibles y no oculta nada si no hay ninguno visible', () => {
    const glass = meshAt(1)
    glass.visible = false
    const text = meshAt(2)
    const scene = setup(glass, text)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)

    expect(text.visible).toBe(true)
    expect(hidden).toHaveLength(0)
  })

  it('no oculta objetos no renderables (grupos)', () => {
    const glass = meshAt(1)
    const group = new Group()
    group.position.z = 5
    const scene = setup(glass, group)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)

    expect(group.visible).toBe(true)
  })
})

describe('restoreBackgroundCapture', () => {
  it('restaura solo lo ocultado y vacía el array', () => {
    const glass = meshAt(1)
    const text = meshAt(2)
    const userHidden = meshAt(3)
    userHidden.visible = false
    const scene = setup(glass, text, userHidden)
    const hidden: Object3D[] = []

    hideForBackgroundCapture(scene, [glass], hidden)
    restoreBackgroundCapture(hidden)

    expect(glass.visible).toBe(true)
    expect(text.visible).toBe(true)
    expect(userHidden.visible).toBe(false)
    expect(hidden).toHaveLength(0)
  })
})
