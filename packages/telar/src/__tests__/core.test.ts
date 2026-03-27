import { describe, it, expect, vi } from 'vitest'
import { knot } from '../core/knot'
import { thread } from '../core/thread'
import { bind } from '../core/bind'
import {
  createStore,
  getNodeValue,
  setNodeValue,
  subscribeToNode,
  getDefaultValue,
} from '../core/store'

// ─── knot ────────────────────────────────────────────────────────────────────

describe('knot', () => {
  it('crea una definición con brand correcto', () => {
    const k = knot({ key: 'count', default: 0 })
    expect(k._brand).toBe('knot')
    expect(k.key).toBe('count')
    expect(k.default).toBe(0)
  })
})

// ─── thread ──────────────────────────────────────────────────────────────────

describe('thread', () => {
  it('crea una definición con brand correcto', () => {
    const t = thread({ key: 'double', get: ({ read }) => 0 })
    expect(t._brand).toBe('thread')
    expect(t.key).toBe('double')
  })
})

// ─── bind ────────────────────────────────────────────────────────────────────

describe('bind', () => {
  it('crea una definición con brand correcto', () => {
    const b = bind({
      key: 'cart',
      default: [] as string[],
      reducers: {
        add: (state, item: string) => [...state, item],
        clear: () => [],
      },
    })
    expect(b._brand).toBe('bind')
    expect(b.key).toBe('cart')
    expect(b.reducers.add([], 'item')).toEqual(['item'])
  })
})

// ─── store — knot ─────────────────────────────────────────────────────────────

describe('store — knot', () => {
  it('retorna el default si el knot no fue seteado', () => {
    const store = createStore()
    const k = knot({ key: 'count', default: 42 })
    expect(getNodeValue(k, store)).toBe(42)
  })

  it('retorna el valor seteado', () => {
    const store = createStore()
    const k = knot({ key: 'count', default: 0 })
    setNodeValue('count', 10, store)
    expect(getNodeValue(k, store)).toBe(10)
  })

  it('acepta función actualizadora', () => {
    const store = createStore()
    const k = knot({ key: 'count', default: 5 })
    setNodeValue<number>('count', (prev) => prev * 2, store, k.default)
    expect(getNodeValue(k, store)).toBe(10)
  })

  it('no notifica si el valor no cambia', () => {
    const store = createStore()
    const k = knot({ key: 'count', default: 0 })
    const listener = vi.fn()
    subscribeToNode('count', listener, store)
    setNodeValue('count', 0, store, k.default)
    expect(listener).not.toHaveBeenCalled()
  })

  it('notifica listeners cuando el valor cambia', () => {
    const store = createStore()
    const k = knot({ key: 'count', default: 0 })
    const listener = vi.fn()
    subscribeToNode('count', listener, store)
    setNodeValue('count', 1, store, k.default)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('el unsubscribe detiene las notificaciones', () => {
    const store = createStore()
    const k = knot({ key: 'count', default: 0 })
    const listener = vi.fn()
    const unsub = subscribeToNode('count', listener, store)
    unsub()
    setNodeValue('count', 1, store, k.default)
    expect(listener).not.toHaveBeenCalled()
  })
})

// ─── store — thread ───────────────────────────────────────────────────────────

describe('store — thread', () => {
  it('evalúa el thread con los valores actuales', () => {
    const store = createStore()
    const price = knot({ key: 'price', default: 10 })
    const qty = knot({ key: 'qty', default: 3 })
    const total = thread({
      key: 'total',
      get: ({ read }) => read(price) * read(qty),
    })

    expect(getNodeValue(total, store)).toBe(30)
  })

  it('retorna el valor cacheado en lecturas sucesivas', () => {
    const store = createStore()
    const getFn = vi.fn(({ read }: any) => read(knot({ key: 'x', default: 5 })) * 2)
    const t = thread({ key: 't', get: getFn })

    getNodeValue(t, store)
    getNodeValue(t, store)

    expect(getFn).toHaveBeenCalledTimes(1)
  })

  it('invalida el cache cuando una dependencia cambia', () => {
    const store = createStore()
    const price = knot({ key: 'price', default: 10 })
    const double = thread({
      key: 'double',
      get: ({ read }) => read(price) * 2,
    })

    expect(getNodeValue(double, store)).toBe(20)

    setNodeValue('price', 20, store)

    expect(getNodeValue(double, store)).toBe(40)
  })

  it('propaga cambios a través de threads encadenados', () => {
    const store = createStore()
    const base = knot({ key: 'base', default: 5 })
    const doubled = thread({
      key: 'doubled',
      get: ({ read }) => read(base) * 2,
    })
    const quadrupled = thread({
      key: 'quadrupled',
      get: ({ read }) => read(doubled) * 2,
    })

    // Primer read — construye el grafo
    expect(getNodeValue(quadrupled, store)).toBe(20)

    setNodeValue('base', 10, store)

    expect(getNodeValue(quadrupled, store)).toBe(40)
  })

  it('notifica a suscriptores del thread cuando cambia su dependencia', () => {
    const store = createStore()
    const price = knot({ key: 'price', default: 10 })
    const total = thread({ key: 'total', get: ({ read }) => read(price) * 2 })

    // Primero evalúa para construir el grafo
    getNodeValue(total, store)

    const listener = vi.fn()
    subscribeToNode('total', listener, store)

    setNodeValue('price', 20, store)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('getDefaultValue evalúa threads con defaults sin store', () => {
    const price = knot({ key: 'price', default: 10 })
    const total = thread({ key: 'total', get: ({ read }) => read(price) * 2 })
    expect(getDefaultValue(total)).toBe(20)
  })
})

// ─── store — bind ─────────────────────────────────────────────────────────────

describe('store — bind', () => {
  it('retorna el default inicial', () => {
    const store = createStore()
    const cart = bind({
      key: 'cart',
      default: [] as string[],
      reducers: { add: (s, item: string) => [...s, item] },
    })
    expect(getNodeValue(cart, store)).toEqual([])
  })

  it('actualiza el estado via reducer', () => {
    const store = createStore()
    const cart = bind({
      key: 'cart',
      default: [] as string[],
      reducers: { add: (s, item: string) => [...s, item] },
    })

    setNodeValue<string[]>('cart', (state) => cart.reducers.add(state, 'item-1'), store, cart.default)
    expect(getNodeValue(cart, store)).toEqual(['item-1'])
  })
})

// ─── grafo de dependencias ────────────────────────────────────────────────────

describe('grafo — dependencias condicionales', () => {
  it('re-suscribe a la dep correcta cuando cambia la condición', () => {
    const store = createStore()
    const mode = knot({ key: 'mode', default: 'a' as 'a' | 'b' })
    const valA = knot({ key: 'valA', default: 'A' })
    const valB = knot({ key: 'valB', default: 'B' })

    const result = thread({
      key: 'result',
      get: ({ read }) =>
        read(mode) === 'a' ? read(valA) : read(valB),
    })

    expect(getNodeValue(result, store)).toBe('A')

    // Cambia a modo 'b' — debe re-evaluar y suscribirse a valB
    setNodeValue('mode', 'b', store)
    expect(getNodeValue(result, store)).toBe('B')

    // Cambiar valA ya no debe afectar result
    const listener = vi.fn()
    subscribeToNode('result', listener, store)
    setNodeValue('valA', 'A-nuevo', store)
    expect(listener).not.toHaveBeenCalled()

    // Cambiar valB sí debe afectar result
    setNodeValue('valB', 'B-nuevo', store)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getNodeValue(result, store)).toBe('B-nuevo')
  })
})
