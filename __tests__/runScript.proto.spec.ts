/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {setupAdapter} from '../src'

describe('runScript(Proto)', () => {
  setupAdapter('PROTO')
  require('./runScript.spec')
})
