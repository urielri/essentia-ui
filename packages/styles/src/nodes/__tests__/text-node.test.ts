// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { Text } from 'troika-three-text'
import { TextNode } from '../text-node.js'

describe('TextNode — construcción', () => {
  it('root es un Text mesh de troika', () => {
    const node = new TextNode({ text: 'hola' })
    expect(node.root).toBeInstanceOf(Text)
    expect(node.mesh).toBe(node.root)
  })

  it('aplica text correctamente', () => {
    const node = new TextNode({ text: 'Hello, world!' })
    expect(node.mesh.text).toBe('Hello, world!')
  })

  it('aplica defaults cuando no se proveen props opcionales', () => {
    const node = new TextNode({ text: 'foo' })
    expect(node.mesh.fontSize).toBe(16)
    expect(node.mesh.color).toBe(0xffffff)
    expect(node.mesh.textAlign).toBe('left')
    expect(node.mesh.anchorX).toBe('left')
    expect(node.mesh.anchorY).toBe('top')
    expect(node.mesh.maxWidth).toBe(Infinity)
    expect(node.mesh.lineHeight).toBe(1.2)
    expect(node.mesh.letterSpacing).toBe(0)
  })

  it('acepta opciones vacías y crea texto vacío', () => {
    const node = new TextNode()
    expect(node.mesh.text).toBe('')
  })

  it('parsea color CSS hex correctamente', () => {
    const node = new TextNode({ text: 'foo', color: '#ff0000' })
    expect(node.mesh.color).toBe(0xff0000)
  })
})

describe('TextNode — setters', () => {
  it('setText actualiza el contenido', () => {
    const node = new TextNode({ text: 'inicial' })
    node.setText('actualizado')
    expect(node.mesh.text).toBe('actualizado')
  })

  it('setFontSize actualiza fontSize', () => {
    const node = new TextNode({ text: 'foo' })
    node.setFontSize(32)
    expect(node.mesh.fontSize).toBe(32)
  })

  it('setColor parsea color CSS', () => {
    const node = new TextNode({ text: 'foo' })
    node.setColor('#00ff00')
    expect(node.mesh.color).toBe(0x00ff00)
  })

  it('setFont actualiza la URL de la fuente', () => {
    const node = new TextNode({ text: 'foo' })
    node.setFont('https://example.com/font.woff')
    expect(node.mesh.font).toBe('https://example.com/font.woff')
  })

  it('setFont con undefined limpia la fuente (null)', () => {
    const node = new TextNode({ text: 'foo', font: 'https://x.com/f.woff' })
    node.setFont(undefined)
    expect(node.mesh.font).toBeNull()
  })

  it('setAlignment actualiza textAlign', () => {
    const node = new TextNode({ text: 'foo' })
    node.setAlignment('center')
    expect(node.mesh.textAlign).toBe('center')
  })

  it('setAnchorX traduce 0/0.5/1 a keywords de troika', () => {
    const node = new TextNode({ text: 'foo' })
    node.setAnchorX(0)
    expect(node.mesh.anchorX).toBe('left')
    node.setAnchorX(0.5)
    expect(node.mesh.anchorX).toBe('center')
    node.setAnchorX(1)
    expect(node.mesh.anchorX).toBe('right')
  })

  it('setAnchorX preserva valores intermedios como número', () => {
    const node = new TextNode({ text: 'foo' })
    node.setAnchorX(0.25)
    expect(node.mesh.anchorX).toBe(0.25)
  })

  it('setAnchorY traduce 0/0.5/1 a keywords de troika', () => {
    const node = new TextNode({ text: 'foo' })
    node.setAnchorY(0)
    expect(node.mesh.anchorY).toBe('top')
    node.setAnchorY(0.5)
    expect(node.mesh.anchorY).toBe('middle')
    node.setAnchorY(1)
    expect(node.mesh.anchorY).toBe('bottom')
  })

  it('setMaxWidth actualiza maxWidth', () => {
    const node = new TextNode({ text: 'foo' })
    node.setMaxWidth(200)
    expect(node.mesh.maxWidth).toBe(200)
  })

  it('setLineHeight actualiza lineHeight', () => {
    const node = new TextNode({ text: 'foo' })
    node.setLineHeight(1.5)
    expect(node.mesh.lineHeight).toBe(1.5)
  })

  it('setLetterSpacing actualiza letterSpacing', () => {
    const node = new TextNode({ text: 'foo' })
    node.setLetterSpacing(2)
    expect(node.mesh.letterSpacing).toBe(2)
  })

  it('todos los setters son chainable', () => {
    const node = new TextNode({ text: 'foo' })
    expect(node.setText('bar')).toBe(node)
    expect(node.setFontSize(20)).toBe(node)
    expect(node.setColor('#000')).toBe(node)
    expect(node.setFont(undefined)).toBe(node)
    expect(node.setAlignment('right')).toBe(node)
    expect(node.setAnchorX(0.5)).toBe(node)
    expect(node.setAnchorY(0.5)).toBe(node)
    expect(node.setMaxWidth(100)).toBe(node)
    expect(node.setLineHeight(1)).toBe(node)
    expect(node.setLetterSpacing(0)).toBe(node)
  })
})

describe('TextNode — destroy', () => {
  it('libera el mesh de troika vía dispose()', () => {
    const node = new TextNode({ text: 'foo' })
    const disposeSpy = vi.spyOn(node.mesh, 'dispose')

    node.destroy()

    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('puede llamarse dos veces sin volver a disponer', () => {
    const node = new TextNode({ text: 'foo' })
    const disposeSpy = vi.spyOn(node.mesh, 'dispose')

    node.destroy()
    node.destroy()

    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })
})
