/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'
import {ScopedStorage} from './inner/ScopedStorage'

export const sessionStorageFeature: IFeatureCreator<any> = (options) => {
  const {$window, scope} = options

  return {
    key: 'sessionStorage',

    install: () => {
      $window.sessionStorage = new ScopedStorage(scope, window.sessionStorage)
    },

    dispose: () => {
      $window.sessionStorage = null
    },

    // defaultOptions: 'sessionStorage' in window,
    defaultOptions: false,
  }
}
