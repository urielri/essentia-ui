import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { knot } from '../core/knot'
import { thread } from '../core/thread'
import { bind } from '../core/bind'
import { TelarRoot } from '../react/TelarRoot'
import { useKnot } from '../react/useKnot'
import { useThread } from '../react/useThread'
import { useBind } from '../react/useBind'
import { useTelar } from '../react/useTelar'

// ─── Wrapper ─────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TelarRoot>{children}</TelarRoot>
)

// ─── useKnot ─────────────────────────────────────────────────────────────────

describe('useKnot', () => {
  it('retorna el valor inicial', () => {
    const count = knot({ key: 'count', default: 0 })
    const { result } = renderHook(() => useKnot(count), { wrapper })
    expect(result.current[0]).toBe(0)
  })

  it('actualiza con valor directo', () => {
    const count = knot({ key: 'count', default: 0 })
    const { result } = renderHook(() => useKnot(count), { wrapper })

    act(() => result.current[1](5))

    expect(result.current[0]).toBe(5)
  })

  it('actualiza con función actualizadora', () => {
    const count = knot({ key: 'count', default: 10 })
    const { result } = renderHook(() => useKnot(count), { wrapper })

    act(() => result.current[1]((prev) => prev * 2))

    expect(result.current[0]).toBe(20)
  })

  it('dos hooks en el mismo árbol comparten el mismo estado', () => {
    const count = knot({ key: 'shared', default: 0 })
    const { result } = renderHook(
      () => ({ a: useKnot(count), b: useKnot(count) }),
      { wrapper },
    )

    act(() => result.current.a[1](42))

    expect(result.current.b[0]).toBe(42)
  })
})

// ─── useThread ───────────────────────────────────────────────────────────────

describe('useThread', () => {
  it('retorna el valor derivado', () => {
    const price = knot({ key: 'price', default: 10 })
    const double = thread({ key: 'double', get: ({ read }) => read(price) * 2 })
    const { result } = renderHook(() => useThread(double), { wrapper })
    expect(result.current).toBe(20)
  })

  it('se actualiza cuando cambia la dependencia', () => {
    const price = knot({ key: 'price', default: 10 })
    const double = thread({ key: 'double', get: ({ read }) => read(price) * 2 })
    const { result } = renderHook(
      () => ({ price: useKnot(price), double: useThread(double) }),
      { wrapper },
    )

    act(() => result.current.price[1](20))

    expect(result.current.double).toBe(40)
  })

  it('es de solo lectura — no expone setter', () => {
    const price = knot({ key: 'price', default: 10 })
    const double = thread({ key: 'double', get: ({ read }) => read(price) * 2 })
    const { result } = renderHook(() => useThread(double), { wrapper })
    expect(typeof result.current).not.toBe('array')
  })
})

// ─── useBind ─────────────────────────────────────────────────────────────────

describe('useBind', () => {
  const cart = bind({
    key: 'cart',
    default: [] as string[],
    reducers: {
      add:    (state, item: string) => [...state, item],
      remove: (state, id: string)   => state.filter((i) => i !== id),
      clear:  ()                    => [],
    },
  })

  it('retorna el estado inicial', () => {
    const { result } = renderHook(() => useBind(cart), { wrapper })
    expect(result.current[0]).toEqual([])
  })

  it('dispatch.add agrega un item', () => {
    const { result } = renderHook(() => useBind(cart), { wrapper })
    act(() => result.current[1].add('item-1'))
    expect(result.current[0]).toEqual(['item-1'])
  })

  it('dispatch.remove elimina un item', () => {
    const { result } = renderHook(() => useBind(cart), { wrapper })
    act(() => result.current[1].add('item-1'))
    act(() => result.current[1].add('item-2'))
    act(() => result.current[1].remove('item-1'))
    expect(result.current[0]).toEqual(['item-2'])
  })

  it('dispatch.clear vacía el estado', () => {
    const { result } = renderHook(() => useBind(cart), { wrapper })
    act(() => result.current[1].add('item-1'))
    act(() => result.current[1].clear())
    expect(result.current[0]).toEqual([])
  })

  it('dispatch está tipado correctamente', () => {
    const { result } = renderHook(() => useBind(cart), { wrapper })
    expect(typeof result.current[1].add).toBe('function')
    expect(typeof result.current[1].remove).toBe('function')
    expect(typeof result.current[1].clear).toBe('function')
  })
})

// ─── useTelar (hook unificado) ────────────────────────────────────────────────

describe('useTelar', () => {
  it('infiere [value, setter] para knot', () => {
    const count = knot({ key: 'count', default: 0 })
    const { result } = renderHook(() => useTelar(count), { wrapper })
    expect(Array.isArray(result.current)).toBe(true)
    act(() => result.current[1](99))
    expect(result.current[0]).toBe(99)
  })

  it('infiere value para thread', () => {
    const price = knot({ key: 'price', default: 5 })
    const triple = thread({ key: 'triple', get: ({ read }) => read(price) * 3 })
    const { result } = renderHook(() => useTelar(triple), { wrapper })
    expect(result.current).toBe(15)
  })

  it('infiere [state, dispatch] para bind', () => {
    const counter = bind({
      key: 'counter',
      default: 0,
      reducers: { inc: (s) => s + 1 },
    })
    const { result } = renderHook(() => useTelar(counter), { wrapper })
    expect(result.current[0]).toBe(0)
    act(() => result.current[1].inc())
    expect(result.current[0]).toBe(1)
  })
})

// ─── TelarRoot aislado ────────────────────────────────────────────────────────

describe('TelarRoot — aislamiento', () => {
  it('dos TelarRoot no comparten estado', () => {
    const count = knot({ key: 'isolated', default: 0 })

    const wrapper1 = ({ children }: { children: React.ReactNode }) => (
      <TelarRoot>{children}</TelarRoot>
    )
    const wrapper2 = ({ children }: { children: React.ReactNode }) => (
      <TelarRoot>{children}</TelarRoot>
    )

    const { result: r1 } = renderHook(() => useKnot(count), { wrapper: wrapper1 })
    const { result: r2 } = renderHook(() => useKnot(count), { wrapper: wrapper2 })

    act(() => r1.current[1](100))

    expect(r1.current[0]).toBe(100)
    expect(r2.current[0]).toBe(0)
  })
})
