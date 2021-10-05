/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {IFeatureCreator} from '../types'

export const documentWrite: IFeatureCreator = (options) => {
  const {$document} = options
  return {
    key: 'document.write',
    install: () => {
      $document.writeln = $document.write = (tagName: string, options?: any) => {
        console.warn(`document.write() & document.writeln() method has been masked. Use another API to do this.`)
        return null
      }
    },
    dispose: () => {},
  }
}
