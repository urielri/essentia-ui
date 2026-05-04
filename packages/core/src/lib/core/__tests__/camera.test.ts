import { describe, it, expect } from 'vitest'
import { OrthographicCamera } from 'three'
import {
  createOrthographicCamera,
  updateCameraFrustum,
  worldToScreen,
  screenToWorld,
} from '../camera.js'

describe('createOrthographicCamera', () => {
  it('crea un frustum 1:1 centrado en origen', () => {
    const cam = createOrthographicCamera(800, 600)
    expect(cam.left).toBe(-400)
    expect(cam.right).toBe(400)
    expect(cam.top).toBe(300)
    expect(cam.bottom).toBe(-300)
  })

  it('posiciona la cámara en z=100', () => {
    const cam = createOrthographicCamera(100, 100)
    expect(cam.position.z).toBe(100)
  })

  it('mantiene near/far correctos', () => {
    const cam = createOrthographicCamera(100, 100)
    expect(cam.near).toBe(0.1)
    expect(cam.far).toBe(1000)
  })
})

describe('updateCameraFrustum', () => {
  it('actualiza el frustum ante resize', () => {
    const cam = createOrthographicCamera(800, 600)
    updateCameraFrustum(cam, 1280, 720)
    expect(cam.left).toBe(-640)
    expect(cam.right).toBe(640)
    expect(cam.top).toBe(360)
    expect(cam.bottom).toBe(-360)
  })

  it('llama updateProjectionMatrix (sin throws)', () => {
    const cam = new OrthographicCamera()
    expect(() => updateCameraFrustum(cam, 100, 100)).not.toThrow()
  })
})

describe('worldToScreen', () => {
  const vp = { width: 800, height: 600 }

  it('centro del mundo → centro de pantalla', () => {
    const result = worldToScreen(0, 0, vp)
    expect(result).toEqual({ x: 400, y: 300 })
  })

  it('esquina superior izquierda de mundo → (0, 0) de pantalla', () => {
    const result = worldToScreen(-400, 300, vp)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('esquina inferior derecha de mundo → (800, 600) de pantalla', () => {
    const result = worldToScreen(400, -300, vp)
    expect(result).toEqual({ x: 800, y: 600 })
  })
})

describe('screenToWorld', () => {
  const vp = { width: 800, height: 600 }

  it('centro de pantalla → origen de mundo', () => {
    const result = screenToWorld(400, 300, vp)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('(0, 0) de pantalla → esquina superior izquierda de mundo', () => {
    const result = screenToWorld(0, 0, vp)
    expect(result).toEqual({ x: -400, y: 300 })
  })

  it('worldToScreen y screenToWorld son inversas', () => {
    const world = { x: 123, y: -87 }
    const screen = worldToScreen(world.x, world.y, vp)
    const back = screenToWorld(screen.x, screen.y, vp)
    expect(back.x).toBeCloseTo(world.x)
    expect(back.y).toBeCloseTo(world.y)
  })
})
