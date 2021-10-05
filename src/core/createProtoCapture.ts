/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {$PatchedHost, IPatchHostOptions} from '../types'
import {isHostPatched} from './api'
import {patchHost} from './patchHost'
import {registerOwnsFixer} from './registerOwnsFixer'

const RE_FIX_KEYS = ['window', 'document', '__proxy__', '__proto__']

const ENUMERABLE = Object.keys(window.document)
const ENUMERABLE_P = Object.keys(Object.getPrototypeOf(window.document)) // window.document.__proto__
const ENUMERABLE_P_P = Object.keys(Object.getPrototypeOf(Object.getPrototypeOf(window.document))) // window.document.__proto__.__proto__

const NEED_BIND_CONTEXT_D = [].concat(ENUMERABLE).concat(ENUMERABLE_P).concat(ENUMERABLE_P_P)

export function createProtoCapture<T = Record<string, any>>(host: any, options?: IPatchHostOptions): $PatchedHost<T> {
  if (isHostPatched(host)) return host

  const win = Object.create(window)
  const doc = Object.create(window.document)
  const fnCache = new WeakMap<Function, Function>()
  const properties: PropertyDescriptorMap = NEED_BIND_CONTEXT_D.reduce((properties, key) => {
    properties[key] = {
      get() {
        const oo = (window.document as any)[key]
        if (typeof oo === 'function') {
          if (!fnCache.has(oo)) fnCache.set(oo, oo.bind(window.document))
          return fnCache.get(oo)
        }
        return oo
      },
      set(v: any) {
        Object.defineProperty(doc, key, {value: v})
      },
      configurable: true,
      enumerable: !!~ENUMERABLE.indexOf(key),
    }
    return properties
  }, {})

  Object.defineProperties(doc, properties)

  win.global = win.globalThis = win.self = win.window = win

  Object.keys(host)
    .filter((key) => key !== 'document')
    .forEach((key) => (win[key] = host[key]))

  host.window = win
  host.document = win.document = doc
  host.__proxy__ = win

  registerOwnsFixer(win)

  patchHost(host, options)

  Object.keys(host)
    .filter((key) => !~RE_FIX_KEYS.indexOf(key))
    .forEach((key) => (win[key] = host[key]))

  return host
}
