import type { KnotDef } from './types'

export function knot<T>(options: { key: string; default: T }): KnotDef<T> {
  return {
    _brand: 'knot',
    key: options.key,
    default: options.default,
  }
}
