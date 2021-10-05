/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {createProxyCapture} from '../src/core/createProxyCapture'

describe('createProxyCapture', () => {
  it('should not set', () => {
    const oo: any = createProxyCapture({})
    oo.sss = 9
    expect(oo.sss).toBe(undefined)
  })

  it('should be freeze prototype', () => {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-function-return-type
    function DDD() {
      this.prototype = {}
    }

    DDD.prototype = {}
    // @ts-ignore
    const document: any = new DDD()
    expect(Object.isFrozen(String.prototype)).toBeFalsy()
    const oo: any = createProxyCapture({document})
    expect(oo.window === oo.global).toBeTruthy()
    expect(Object.isFrozen(oo.String)).toBeTruthy()
  })

  it('should be freeze prototype with already freeze', () => {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-function-return-type
    function DDD() {
      this.prototype = {}
    }

    DDD.prototype = {}
    // @ts-ignore
    const document: any = new DDD()
    expect(Object.isFrozen(String.prototype)).toBeFalsy()
    Object.freeze(String.prototype)
    const oo: any = createProxyCapture({document})
    expect(oo.window === oo.global).toBeTruthy()
    expect(Object.isFrozen(oo.String)).toBeTruthy()
  })
})
