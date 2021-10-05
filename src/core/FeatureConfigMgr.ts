/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureConfigure, IFeatureConfigureCommon} from '../types'

export class FeatureConfigMgr {
  configs: IFeatureConfigureCommon[]

  constructor(configs: IFeatureConfigure[]) {
    this.configs = configs
      .map((config) => {
        if (typeof config === 'string') {
          return [config, null] as IFeatureConfigureCommon
        }

        if (Array.isArray(config) && config.length) {
          if (config.length === 1) return [...config, null] as IFeatureConfigureCommon

          // Ignore invalid parameters
          return config.slice(0, 2) as IFeatureConfigureCommon
        }

        return null
      })
      .filter(Boolean)
  }

  getOptions(key: string, defaultOptions?: boolean | Record<string, any>): IFeatureConfigureCommon[1] {
    const config = this.configs.find((c) => c[0] === key)
    if (!config)
      // defaultOptions is not configured (=== undefined), which means it is enabled by default
      // Otherwise, convert directly to a Boolean object and return the result
      return defaultOptions === undefined ? true : defaultOptions
    return config[1]
  }
}
