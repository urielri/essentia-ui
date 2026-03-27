import type { ThreadDef, ReadContext } from './types'

export function thread<T>(options: {
  key: string
  get: (ctx: ReadContext) => T
}): ThreadDef<T> {
  return {
    _brand: 'thread',
    key: options.key,
    get: options.get,
  }
}
