/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
export type IFeatureConfigureCommon = [string, Record<string, any> | boolean | string | null]
export type IFeatureConfigure = string | [string] | IFeatureConfigureCommon

export type IFeatureCreator<W = Window, D = Document> = (options: {
  $window: $PatchedHost<W>
  $document: D
  $options: IPatchHostOptions
  scope: string
}) => IFeature

export interface IFeature {
  key: string
  install: (config?: Record<string, any> | boolean | string | null) => any
  dispose: () => void

  defaultOptions?: boolean | Record<string, any>
  // mainly used for testing purposes
  __cache__?: any
}

export interface IPatchHostOptions {
  mode?: 'anonymous' | 'inline'
  scope?: string
  wrap?: (code: string) => string
  configs?: IFeatureConfigure[]
  featureCreators?: IFeatureCreator[]
}

export type $PatchedHost<T extends Record<string, any>> = T & {
  window: Window
  global: Window
  globalThis: Window
  self: Window
  document: Document
}
