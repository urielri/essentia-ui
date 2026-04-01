import { Object3D } from 'three'

export type Anchor = {
  /** Normalizado 0–1. 0 = izquierda, 1 = derecha */
  x: number
  /** Normalizado 0–1. 0 = arriba, 1 = abajo */
  y: number
}

export type Bounds = {
  /** Ancho en unidades de mundo (= píxeles con cámara 1:1) */
  width: number
  /** Alto en unidades de mundo (= píxeles con cámara 1:1) */
  height: number
}

/**
 * Unidad mínima de UI en Essentia.
 *
 * Encapsula uno o más Object3D de Three.js y expone una API de
 * alto nivel para transform, bounds y anchoring dentro del scene graph.
 * Las transformaciones se heredan en GPU a través de root.
 */
export class EssentiaNode {
  readonly root: Object3D

  private _bounds: Bounds = { width: 0, height: 0 }
  private _anchor: Anchor = { x: 0.5, y: 0.5 }
  private _parent: EssentiaNode | null = null
  private _children: EssentiaNode[] = []

  constructor(root?: Object3D) {
    this.root = root ?? new Object3D()
  }

  get bounds(): Readonly<Bounds> {
    return this._bounds
  }

  get anchor(): Readonly<Anchor> {
    return this._anchor
  }

  get parent(): EssentiaNode | null {
    return this._parent
  }

  get children(): readonly EssentiaNode[] {
    return this._children
  }

  /**
   * Define el tamaño del nodo en unidades de mundo.
   * Con cámara ortográfica 1:1, equivale a píxeles.
   */
  setSize(width: number, height: number): this {
    this._bounds = { width, height }
    return this
  }

  /**
   * Define el punto de anclaje normalizado (0–1) dentro del nodo padre.
   * (0.5, 0.5) = centro, (0, 0) = esquina superior izquierda.
   */
  setAnchor(x: number, y: number): this {
    this._anchor = { x, y }
    return this
  }

  /** Posiciona el nodo en coordenadas de mundo. */
  setPosition(x: number, y: number, z = 0): this {
    this.root.position.set(x, y, z)
    return this
  }

  /** Escala uniforme del nodo. */
  setScale(scale: number): this {
    this.root.scale.setScalar(scale)
    return this
  }

  addChild(child: EssentiaNode): this {
    if (child._parent) {
      child._parent.removeChild(child)
    }
    child._parent = this
    this._children.push(child)
    this.root.add(child.root)
    return this
  }

  removeChild(child: EssentiaNode): this {
    const idx = this._children.indexOf(child)
    if (idx === -1) return this
    this._children.splice(idx, 1)
    child._parent = null
    this.root.remove(child.root)
    return this
  }

  /**
   * Destruye el nodo y todos sus hijos.
   * Se desvincula del padre y libera referencias.
   */
  destroy(): void {
    this._parent?.removeChild(this)
    // Copia del array porque destroy() muta _children
    for (const child of [...this._children]) {
      child.destroy()
    }
    this._children = []
  }
}
