/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'
import {ScopedStorage} from './inner/ScopedStorage'

export const localStorageFeature: IFeatureCreator<any> = (options) => {
  const {$window, scope} = options

  return {
    key: 'localStorage',

    install: () => {
      $window.localStorage = new ScopedStorage(scope, window.localStorage)
    },

    dispose: () => {
      $window.localStorage = null
    },

    defaultOptions: 'localStorage' in window,
  }
}
