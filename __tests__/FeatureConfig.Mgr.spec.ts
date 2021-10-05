/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {FeatureConfigMgr} from '../src/core/FeatureConfigMgr'

describe('FeatureConfig.Mgr', () => {
  it('should be patch with string', () => {
    const oo = new FeatureConfigMgr(['a'])
    expect(oo.configs).toEqual([['a', null]])
    expect(oo.getOptions('a')).toBe(null)
    expect(oo.getOptions('a') !== false).toBe(true)
  })

  it('should be patch with simple array', () => {
    const oo = new FeatureConfigMgr([['a'], null])
    expect(oo.configs).toEqual([['a', null]])
    expect(oo.getOptions('a')).toBe(null)
    expect(oo.getOptions('a') !== false).toBe(true)
  })

  it('should be patch with boolean options', () => {
    const o0 = new FeatureConfigMgr([
      ['a', true],
      ['b', {K: 1}],
    ])
    expect(o0.configs).toEqual([
      ['a', true],
      ['b', {K: 1}],
    ])

    const o1 = new FeatureConfigMgr([['a', false]])
    expect(o1.configs).toEqual([['a', false]])

    const o2 = new FeatureConfigMgr([['a', true]])
    expect(o2.configs).toEqual([['a', true]])

    expect(o0.getOptions('b') !== false).toBeTruthy()
    expect(o0.getOptions('b')).toEqual({K: 1})
    expect(o1.getOptions('a') !== false).toBeFalsy()
    expect(o2.getOptions('a') !== false).toBeTruthy()
    expect(o2.getOptions('c') !== false).toBeTruthy()
    expect(o2.getOptions('d') !== false).toBeTruthy()

    expect(o0.getOptions('c')).toBe(true)
    expect(o0.getOptions('cccc')).toBe(true)
  })
})
