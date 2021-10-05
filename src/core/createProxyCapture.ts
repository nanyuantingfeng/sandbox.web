/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {registerOwnsFixer} from './registerOwnsFixer'
import {IPatchHostOptions} from '../types'
import {patchHost} from './patchHost'

const NEED_BIND_CONTEXT_W: string[] = [
  'fetch',
  'btoa',
  'atob',
  'alert',
  'confirm',
  'blur',
  'captureEvents',
  'close',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'webkitRequestAnimationFrame',
  'webkitCancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
  'addEventListener',
  'removeEventListener',
  'find',
  'focus',
  'getComputedStyle',
  'getSelection',
  'matchMedia',
  'moveBy',
  'moveTo',
  'open',
  'postMessage',
  'print',
  'prompt',
  'queueMicrotask',
  'releaseEvents',
  'openDatabase',
  'resizeBy',
  'resizeTo',
  'scroll',
  'scrollBy',
  'scrollTo',
  'stop',
  'webkitRequestFileSystem',
  'webkitResolveLocalFileSystemURL',
]

const HOST_CAPTURE_CELLAR = new WeakMap<Object, ProxyConstructor>()

export function createProxyCapture(host: Record<string, any>, options?: IPatchHostOptions): ProxyConstructor {
  patchHost(host, options)

  if (HOST_CAPTURE_CELLAR.has(host)) return HOST_CAPTURE_CELLAR.get(host)

  const fnCache = new WeakMap<Function, Function>()

  const $win = new Proxy(host, {
    get(target: any, prop: string, receiver: any): any {
      const _at_target = Reflect.has(target, prop)
      const oo = _at_target ? Reflect.get(target, prop, receiver) : Reflect.get(window, prop)
      // In addition to the function, it can also be the constructor of the class
      // Do not blindly use (.bind(window))
      if (!_at_target && typeof oo === 'function' && !!~NEED_BIND_CONTEXT_W.indexOf(prop)) {
        if (!fnCache.has(oo)) fnCache.set(oo, oo.bind(window))
        return fnCache.get(oo)
      }
      return oo
    },
    has(target: any, prop: string): boolean {
      return Reflect.has(target, prop) || Reflect.has(window, prop)
    },
    set(target: any, prop: string, value: any): boolean {
      if (!!~['global', 'globalThis', 'window', 'self', 'document'].indexOf(prop)) return true
      Reflect.set(target, prop, value)
      return true
    },
    ownKeys(target: any): ArrayLike<string | symbol> {
      return Array.from(new Set([].concat(Reflect.ownKeys(window)).concat(Reflect.ownKeys(target))))
    },
  })

  const doc = host.document
  // Here is a patch
  // In native Object.keys(document) returns ['location'],
  // This patch is added because ownKeys cannot be accessed
  doc.location = doc.location || document.location

  const $doc = new Proxy(doc, {
    get(target: any, prop: string, receiver: any): any {
      const _at_target = Reflect.has(target, prop)
      const oo = _at_target ? Reflect.get(target, prop, receiver) : Reflect.get(document, prop)
      // There is a clear difference between this and the Window method
      // To call a method on document, you usually need to bind the context (.bind(document)),
      // If the context is not bound, there is a high probability that no obvious exception will occur
      // There are only a few special functions that need to be bound on Window
      if (!_at_target && typeof oo === 'function') {
        if (!fnCache.has(oo)) fnCache.set(oo, oo.bind(document))
        return fnCache.get(oo)
      }
      return oo
    },
    has(target: any, prop: string): boolean {
      return Reflect.has(target, prop) || Reflect.has(document, prop)
    },
    set(target: any, prop: string, value: any): boolean {
      Reflect.set(target, prop, value)
      return true
    },
    ownKeys(target: any): ArrayLike<string | symbol> {
      return Array.from(new Set([].concat(Reflect.ownKeys(document)).concat(Reflect.ownKeys(target))))
    },
  })

  host.global = host.globalThis = host.self = host.window = $win

  host.document = $doc

  registerOwnsFixer($win)

  const capture = new Proxy(
    {
      __proto__: null,
      __proxy__: $win,
      global: $win,
      globalThis: $win,
      window: $win,
      self: $win,
      document: $doc,
    },
    {
      get(target: any, prop: string | symbol, receiver: any): any {
        if (prop === Symbol.unscopables) return undefined
        return Reflect.get(target, prop, receiver)
      },
      set(): boolean {
        return true
      },
      has(target: any, prop: string | symbol): boolean {
        return Reflect.has(target, prop)
      },
    },
  )

  HOST_CAPTURE_CELLAR.set(host, capture)
  return capture
}
