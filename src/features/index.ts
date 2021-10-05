/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {localStorageFeature} from './localStorage'
import {requestAnimationFrameFeature} from './requestAnimationFrame'
import {sessionStorageFeature} from './sessionStorage'
import {setIntervalFeature} from './setInterval'
import {setTimeoutFeature} from './setTimeout'
import {documentCookie} from './document.cookie'
import {documentWrite} from './document.write'
import {IFeatureCreator} from '../types'

import {addEventListenerFeatureForDocument, addEventListenerFeatureForWindow} from './addEventListener'
import {createElementFeature} from './createElement'
import {evalFeature} from './eval'

export const sysFeatureCreators: Array<IFeatureCreator<any>> = [
  addEventListenerFeatureForWindow,
  addEventListenerFeatureForDocument,

  createElementFeature,
  documentCookie,
  documentWrite,
  evalFeature,

  localStorageFeature,
  requestAnimationFrameFeature,
  sessionStorageFeature,
  setIntervalFeature,
  setTimeoutFeature,
]
