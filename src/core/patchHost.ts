/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {sysFeatureCreators} from '../features'
import {$PatchedHost, IFeature, IPatchHostOptions} from '../types'
import {FeatureConfigMgr} from './FeatureConfigMgr'
import {isHostPatched, setDisposer, setFeaturesByHost} from './api'

let ii = 0

function anonymousScope(): string {
  return `__anonymous_scope_${ii++}`
}

export function patchHost<T = Record<string, any>>(host: $PatchedHost<T>): $PatchedHost<T>
export function patchHost<T = Record<string, any>>(host: T, options: IPatchHostOptions): $PatchedHost<T>
export function patchHost<T = Record<string, any>>(host: any, options?: IPatchHostOptions): $PatchedHost<T> {
  // It is possible that the current host has been patched and there is no document node.
  if (!host.document) host.document = {}

  if (isHostPatched(host)) return host

  const {scope = anonymousScope(), configs, featureCreators} = options || {}
  const configMgr = new FeatureConfigMgr(configs || [])

  const features: IFeature[] = sysFeatureCreators
    .concat(featureCreators)
    .filter((fc) => typeof fc === 'function')
    .map((featureCreator) =>
      featureCreator({
        scope,
        $options: options,
        $window: host,
        $document: host.document,
      }),
    )

  const installedFeatures = features
    .map((f) => {
      const options = configMgr.getOptions(f.key, f.defaultOptions)
      // if options === false, Indicates that this feature is expected to be masked.
      if (options !== false) {
        f.install(options)
        return f
      }
      return null
      // filter out feature of is not installed
    })
    .filter(Boolean)

  setDisposer(host, () => installedFeatures.forEach((f) => f.dispose()))
  setFeaturesByHost(host, installedFeatures)
  return host
}
