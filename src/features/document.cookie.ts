/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'
import Cookie from './inner/Cookie'

export const documentCookie: IFeatureCreator = (options) => {
  const {scope, $document} = options
  return {
    key: 'document.cookie',
    install: () => {
      Object.defineProperty($document, 'cookie', {
        set(value: string) {
          Cookie.set(scope, String(value))
        },
        get() {
          return Cookie.get(scope)
        },
        enumerable: true,
      })
    },
    dispose: () => {
      Cookie.remove(scope)
    },
  }
}
