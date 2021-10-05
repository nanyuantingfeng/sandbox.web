/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {createProxyCapture} from './createProxyCapture'
import {wrapCode} from './wrapper'
import {IPatchHostOptions} from '../types'
import {createProtoCapture} from './createProtoCapture'
import {getAdapter, setDisposer} from './api'
import {uuid} from './uuid'

const IS_SUPPORT_PROXY = 'Proxy' in window

declare global {
  interface Window {
    __$$GLOBAL_CAPTURE_CELLAR__: Record<string, any>
  }
}

// For inline mode
window.__$$GLOBAL_CAPTURE_CELLAR__ = {} as Record<string, any>

function getCapture(host: any, options: IPatchHostOptions) {
  switch (getAdapter()) {
    case 'PROXY':
      return createProxyCapture(host, options)
    case 'PROTO':
      return createProtoCapture(host, options)
    // The default is auto select mode
    case 'AUTO':
    default:
      return IS_SUPPORT_PROXY ? createProxyCapture(host, options) : createProtoCapture(host, options)
  }
}

function runCode(code: string, host: any, options?: IPatchHostOptions): any {
  return options?.mode === 'inline' ? runCodeByInline(code, host, options) : runCodeByAnonymous(code, host, options)
}

function runCodeByAnonymous(code: string, host: any, options?: IPatchHostOptions): any {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('capture', code)
  const capture = getCapture(host, options)
  return fn.call(host.window, capture)
}

function runCodeByInline(code: string, host: any, options?: IPatchHostOptions): any {
  const capture = getCapture(host, options)
  const id = uuid()

  window.__$$GLOBAL_CAPTURE_CELLAR__[id] = capture // Register capture to the global domain

  // The corresponding cached value is deleted at unload time
  setDisposer(host, () => {
    delete window.__$$GLOBAL_CAPTURE_CELLAR__[id] // delete definition cache
    delete window.__$$GLOBAL_CAPTURE_CELLAR__['RESULT__' + id] // delete defined values
    document.head.removeChild(document.getElementById(id)) // remove the label
  })

  const el = document.createElement('script')
  el.setAttribute('id', id)
  el.textContent = `
    var capture = __$$GLOBAL_CAPTURE_CELLAR__['${id}']
    __$$GLOBAL_CAPTURE_CELLAR__['RESULT__${id}'] = (function(capture){
      ${code}
    }).call(capture.window, capture);
  `
  document.head.appendChild(el)
  return window.__$$GLOBAL_CAPTURE_CELLAR__['RESULT__' + id]
}

export function compile(code: string) {
  return (host: any, options?: IPatchHostOptions) => runCode(wrapCode(code, options?.wrap), host, options)
}
