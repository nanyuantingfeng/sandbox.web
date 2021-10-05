/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'

export const setTimeoutFeature: IFeatureCreator = (options) => {
  const {$window} = options
  const ids: number[] = []

  return {
    key: 'setTimeout',

    install: () => {
      $window.setTimeout = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
        const id = window.setTimeout(handler, timeout, ...args)
        ids.push(id)
        return id
      }
    },

    dispose: () => {
      ids.forEach((id) => window.clearTimeout(id))
      ids.splice(0)
    },

    __cache__: ids,
  }
}
