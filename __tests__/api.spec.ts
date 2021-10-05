/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {dispose, IFeatureCreator, isHostPatched, patchHost, setDisposeErrorHandler, setDisposer} from '../src'

describe('api', () => {
  it('isHostPatched', () => {
    const host = {}
    expect(isHostPatched(host)).toBeFalsy()
    const sandbox = patchHost(host, {scope: 'A'})
    expect(isHostPatched(host)).toBeTruthy()
    expect(isHostPatched(sandbox)).toBeTruthy()

    expect(host === sandbox).toBeTruthy()

    const sandbox2 = patchHost(sandbox)
    expect(host === sandbox).toBeTruthy()
    expect(host === sandbox2).toBeTruthy()
  })

  it('dispose', () => {
    dispose({})

    const _feature1: IFeatureCreator = () => {
      return {
        key: 'X',
        install: () => {},
        dispose: () => {
          throw new Error('222')
        },
      }
    }

    const _feature2: IFeatureCreator = () => {
      return {
        key: 'XX',
        install: () => {},
        dispose: 0 as any,
      }
    }

    const _feature3: IFeatureCreator = () => {
      return {
        key: 'XXX',
        install: () => {},
        dispose: null,
      }
    }

    const host = patchHost(
      {document: {s: 2}},
      {
        scope: '2',
        featureCreators: [_feature1, _feature2, null, {} as any, false, _feature3],
      },
    )

    setDisposer(host, () => {
      throw new Error('1111')
    })

    dispose(host)
  })

  it('setDisposeErrorHandler', () => {
    const host = patchHost({}, {scope: '2'})
    setDisposer(host, () => {
      throw new Error('1111')
    })

    const fn0 = jest.fn((e) => expect(e.message).toEqual('1111'))
    const fn1 = jest.fn((e) => expect(e.message).toEqual('1111'))
    setDisposeErrorHandler(host, fn0)
    setDisposeErrorHandler(host, fn0)
    setDisposeErrorHandler(host, fn0)
    setDisposeErrorHandler(host, fn0)
    setDisposeErrorHandler(host, fn1)

    dispose(host)

    expect(fn0).toBeCalledTimes(1)
    expect(fn1).toBeCalledTimes(1)
  })
})
