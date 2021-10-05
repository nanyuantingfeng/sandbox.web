/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'
import {runScript} from '../core/runScript'

const NEW_ELEMENT_CELLAR = new WeakMap<Node, Function>()

function intercept(element: HTMLScriptElement): () => Promise<string> {
  let code: string

  const __handler = {
    set: (s: string) => (code = s),
    get: () => code,
  }

  Object.defineProperty(element, 'innerHTML', __handler)
  Object.defineProperty(element, 'textContent', __handler)

  let src: string
  const _setAttribute = element.setAttribute.bind(element)
  const _getAttribute = element.getAttribute.bind(element)

  element.setAttribute = (qualifiedName: string, value: string) => {
    if (qualifiedName !== 'src') return _setAttribute(qualifiedName, value)
    src = value
  }

  element.getAttribute = (qualifiedName: string) => {
    if (qualifiedName !== 'src') return _getAttribute(qualifiedName)
    return src
  }

  Object.defineProperty(element, 'src', {
    set: (s: string) => (src = s),
    get: () => src,
  })

  return () => {
    if (code) return Promise.resolve(code)

    if (src)
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.withCredentials = false
        xhr.onreadystatechange = () => {
          if (xhr.readyState == 4) {
            if (xhr.status >= 200 && xhr.status <= 299) {
              resolve((code = xhr.responseText))
            } else {
              console.error(`XHR get script code Error --> ${src} -> status:${xhr.status}`)
              resolve(undefined)
            }
          }
        }
        xhr.open('GET', src, true)
        xhr.send()
      })

    return Promise.resolve(undefined)
  }
}

function whenReady(node: Node) {
  if (NEW_ELEMENT_CELLAR.has(node)) NEW_ELEMENT_CELLAR.get(node)()
}

const __Node_insertBefore = Node.prototype.insertBefore
const __Node_appendChild = Node.prototype.appendChild
const __Element_append = Element.prototype.append

Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node) {
  whenReady(newNode)
  return __Node_insertBefore.call(this, newNode, referenceNode)
}

// covered the Node.prototype.appendChild, don't need to cover Element.prototype.appendChild
Node.prototype.appendChild = function <T extends Node>(newChild: T): T {
  whenReady(newChild)
  return __Node_appendChild.call(this, newChild)
}

Element.prototype.append = function (...nodes: (Node | string)[]): void {
  nodes.filter((node) => typeof node !== 'string').forEach((node: Node) => whenReady(node))
  return __Element_append.apply(this, nodes)
}

export const createElementFeature: IFeatureCreator = (options) => {
  const {$document, $window, $options} = options
  const oo: Element[] = []
  return {
    key: 'document.createElement',
    install: () => {
      $document.createElement = function (tagName: string, options?: any) {
        const element = document.createElement(tagName, options)
        oo.push(element)
        if (tagName.toUpperCase() === 'SCRIPT') {
          const getCode = intercept(element as HTMLScriptElement)
          NEW_ELEMENT_CELLAR.set(element, async () => {
            const code = await getCode()
            if (code) runScript(code, $window, {...$options, wrap: null})
          })
        }
        return element
      }
    },
    dispose() {
      oo.forEach((element) => {
        // It is likely to be deleted during runtime
        // Check whether parentElement exists
        // If it does not exist, element has been removed
        element.parentElement?.removeChild(element)
      })
      oo.splice(0)
    },
    __cache__: oo,
  }
}
