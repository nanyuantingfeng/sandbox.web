/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'

function __install(sandbox: any, global: any, oo: any[][]): void {
  sandbox.addEventListener = function (type: any, listener: any, options: any) {
    global.addEventListener(type, listener, options)
    oo.push([type, listener, options])
  }
}

function __dispose(global: any, oo: any[][]): void {
  // eslint-disable-next-line prefer-spread
  oo.forEach((o) => global.removeEventListener.apply(global, o))
  oo.splice(0)
}

export const addEventListenerFeatureForWindow: IFeatureCreator = (options) => {
  const oo: any[][] = []
  return {
    key: 'window.addEventListener',
    install: () => __install(options.$window, window, oo),
    dispose: () => __dispose(window, oo),
    __cache__: oo,
  }
}

export const addEventListenerFeatureForDocument: IFeatureCreator = (options) => {
  const oo: any[][] = []
  return {
    key: 'document.addEventListener',
    install: () => __install(options.$document, document, oo),
    dispose: () => __dispose(document, oo),
    __cache__: oo,
  }
}
