/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'

export const requestAnimationFrameFeature: IFeatureCreator<any> = (options) => {
  const {$window} = options
  const ids: number[] = []

  return {
    key: 'requestAnimationFrame',

    install: () => {
      $window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        const id = window.requestAnimationFrame(callback)
        ids.push(id)
        return id
      }
    },

    dispose: () => {
      ids.forEach((id) => {
        window.cancelAnimationFrame(id)
      })
      ids.splice(0)
    },

    __cache__: ids,

    defaultOptions: 'requestAnimationFrame' in window,
  }
}
