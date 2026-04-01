import { describe, it, expect, vi } from 'vitest'
import { Object3D } from 'three'
import { EssentiaNode } from '../essentia-node.js'

describe('EssentiaNode — construcción', () => {
  it('crea un Object3D interno si no se provee uno', () => {
    const node = new EssentiaNode()
    expect(node.root).toBeInstanceOf(Object3D)
  })

  it('usa el Object3D provisto', () => {
    const obj = new Object3D()
    const node = new EssentiaNode(obj)
    expect(node.root).toBe(obj)
  })

  it('valores por defecto correctos', () => {
    const node = new EssentiaNode()
    expect(node.bounds).toEqual({ width: 0, height: 0 })
    expect(node.anchor).toEqual({ x: 0.5, y: 0.5 })
    expect(node.parent).toBeNull()
    expect(node.children).toHaveLength(0)
  })
})

describe('EssentiaNode — transform', () => {
  it('setSize actualiza bounds', () => {
    const node = new EssentiaNode()
    node.setSize(200, 100)
    expect(node.bounds).toEqual({ width: 200, height: 100 })
  })

  it('setSize es chainable', () => {
    const node = new EssentiaNode()
    const result = node.setSize(10, 10)
    expect(result).toBe(node)
  })

  it('setAnchor actualiza anchor', () => {
    const node = new EssentiaNode()
    node.setAnchor(0, 1)
    expect(node.anchor).toEqual({ x: 0, y: 1 })
  })

  it('setPosition actualiza position del root', () => {
    const node = new EssentiaNode()
    node.setPosition(100, -50, 5)
    expect(node.root.position.x).toBe(100)
    expect(node.root.position.y).toBe(-50)
    expect(node.root.position.z).toBe(5)
  })

  it('setPosition usa z=0 por defecto', () => {
    const node = new EssentiaNode()
    node.setPosition(0, 0)
    expect(node.root.position.z).toBe(0)
  })

  it('setScale escala el root uniformemente', () => {
    const node = new EssentiaNode()
    node.setScale(2)
    expect(node.root.scale.x).toBe(2)
    expect(node.root.scale.y).toBe(2)
    expect(node.root.scale.z).toBe(2)
  })
})

describe('EssentiaNode — jerarquía', () => {
  it('addChild vincula padre e hijo', () => {
    const parent = new EssentiaNode()
    const child = new EssentiaNode()
    parent.addChild(child)

    expect(parent.children).toContain(child)
    expect(child.parent).toBe(parent)
  })

  it('addChild agrega el root del hijo al root del padre (scene graph)', () => {
    const parent = new EssentiaNode()
    const child = new EssentiaNode()
    parent.addChild(child)

    expect(parent.root.children).toContain(child.root)
  })

  it('removeChild desvincula padre e hijo', () => {
    const parent = new EssentiaNode()
    const child = new EssentiaNode()
    parent.addChild(child)
    parent.removeChild(child)

    expect(parent.children).not.toContain(child)
    expect(child.parent).toBeNull()
    expect(parent.root.children).not.toContain(child.root)
  })

  it('addChild reasigna el hijo si ya tenía padre', () => {
    const parentA = new EssentiaNode()
    const parentB = new EssentiaNode()
    const child = new EssentiaNode()

    parentA.addChild(child)
    parentB.addChild(child)

    expect(parentA.children).not.toContain(child)
    expect(parentB.children).toContain(child)
    expect(child.parent).toBe(parentB)
  })

  it('removeChild en nodo no hijo no hace nada', () => {
    const parent = new EssentiaNode()
    const stranger = new EssentiaNode()
    expect(() => parent.removeChild(stranger)).not.toThrow()
  })
})

describe('EssentiaNode — destroy', () => {
  it('se desvincula del padre', () => {
    const parent = new EssentiaNode()
    const child = new EssentiaNode()
    parent.addChild(child)
    child.destroy()

    expect(parent.children).not.toContain(child)
    expect(child.parent).toBeNull()
  })

  it('destruye hijos en cascada', () => {
    const root = new EssentiaNode()
    const child = new EssentiaNode()
    const grandchild = new EssentiaNode()
    root.addChild(child)
    child.addChild(grandchild)

    root.destroy()

    expect(root.children).toHaveLength(0)
    expect(child.children).toHaveLength(0)
    expect(grandchild.parent).toBeNull()
  })

  it('destroy en nodo sin padre no lanza error', () => {
    const node = new EssentiaNode()
    expect(() => node.destroy()).not.toThrow()
  })
})
