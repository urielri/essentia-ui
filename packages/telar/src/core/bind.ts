import type { BindDef, Reducers } from './types'

export function bind<T, R extends Reducers<T>>(options: {
  key: string
  default: T
  reducers: R
}): BindDef<T, R> {
  return {
    _brand: 'bind',
    key: options.key,
    default: options.default,
    reducers: options.reducers,
  }
}
