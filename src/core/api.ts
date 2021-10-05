/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeature} from '../types'

const disposerCellar = new WeakMap<Object, Function[]>()
const featuresCellar = new WeakMap<Object, IFeature[]>()
const disposerErrorHandlerCellar = new WeakMap<Object, Function[]>()

export function setDisposer(host: Object, fn: Function): void {
  if (!disposerCellar.has(host)) disposerCellar.set(host, [])
  const fns = disposerCellar.get(host)
  fns.push(fn)
  disposerCellar.set(host, fns)
}

export function isHostPatched(host: Object): boolean {
  return disposerCellar.has(host)
}

export function dispose(host: Object): void {
  if (isHostPatched(host)) {
    const fns = disposerCellar.get(host)
    try {
      fns.forEach((f) => f())
    } catch (e) {
      ;(disposerErrorHandlerCellar.get(host) || []).forEach((handler) => handler(e))
      console.error(e)
    }
  }
}

export function setFeaturesByHost(host: Object, features: IFeature[]): void {
  featuresCellar.set(host, features)
}

export function getFeaturesByHost(host: Object): IFeature[] {
  return featuresCellar.get(host)
}

export function setDisposeErrorHandler(host: Object, handler: (e: Error) => void): void {
  if (!disposerErrorHandlerCellar.has(host)) disposerErrorHandlerCellar.set(host, [])
  const fns = disposerErrorHandlerCellar.get(host)
  if (!!~fns.indexOf(handler)) return
  fns.push(handler)
  disposerErrorHandlerCellar.set(host, fns)
}

export type IAdapter = 'PROXY' | 'PROTO' | 'AUTO' | 'proxy' | 'proto' | 'auto'

let sandboxAdapter: IAdapter = 'AUTO'

export function setupAdapter(adapter: IAdapter) {
  sandboxAdapter = adapter.toUpperCase() as IAdapter
}

export function getAdapter(): IAdapter {
  return sandboxAdapter
}
