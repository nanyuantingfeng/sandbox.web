/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'

export const setIntervalFeature: IFeatureCreator = (options) => {
  const {$window} = options
  const ids: number[] = []

  return {
    key: 'setInterval',

    install: () => {
      $window.setInterval = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
        const id = window.setInterval(handler, timeout, ...args)
        ids.push(id)
        return id
      }
    },

    dispose: () => {
      ids.forEach((id) => window.clearInterval(id))
      ids.splice(0)
    },

    __cache__: ids,
  }
}
