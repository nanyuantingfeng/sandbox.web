/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'
import {runScript} from '../core/runScript'

export const evalFeature: IFeatureCreator<Window & {eval: (code: string) => any}> = (options) => {
  const {$window, $options} = options

  return {
    key: 'eval',

    install: () => {
      $window.eval = (code: string) => runScript(code, $window, {...$options, wrap: null})
    },

    dispose: () => {},

    // This feature is disabled by default
    defaultOptions: false,
  }
}
