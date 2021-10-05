/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
// @ts-nocheck
import {compile, dispose, getFeaturesByHost, patchHost, runScript} from '../src'

/****
 * Jest JSDOM does not automatically reset instances,
 * So each time you need to manually clean up the temporary
 * resources of the test to avoid contamination
 */
afterEach(() => {
  delete window.sss
  delete window.eee
  delete window.fff
  delete window.SSS
  delete window.S
  delete window.React
  delete window.document.U
  delete window.G

  document.getElementsByTagName('html')[0].innerHTML = ''
})

function wrap(script: string): string {
  return ` 
              var module = {exports : {}};
              var exports = module.exports;
              ${script}
              return module.exports;
             `
}

describe('features', () => {
  // eslint-disable-next-line @typescript-eslint/require-await
  it('setTimeout', async () => {
    const proto = {} as any

    const host = patchHost(proto, {scope: 'a'})

    const fn = compile(
      `
      window.EEE = []
      const id = setTimeout(() => {
          console.log(1)
      }, 1000)
      window.EEE.push(id)
    `,
    )

    const features = getFeaturesByHost(host)
    const _f = features.find((f) => f.key === 'setTimeout')

    fn(host)

    expect(host).toBe(proto)
    expect(_f.__cache__).toEqual(proto.EEE)

    expect(proto.EEE.length).toEqual(1)
    dispose(proto)
    expect(_f.__cache__).toEqual([])
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  it('setInterval', async () => {
    const proto = {} as any

    const host = patchHost(proto, {
      scope: 'a',
    })

    const fn = compile(
      `
      window.EEE = []
      const id = setInterval(() => {
          console.log(1)
      }, 1000)
      window.EEE.push(id)
    `,
    )

    const features = getFeaturesByHost(host)
    const _f = features.find((f) => f.key === 'setInterval')

    fn(host)

    expect(host).toBe(proto)
    expect(_f.__cache__).toEqual(proto.EEE)

    expect(proto.EEE.length).toEqual(1)
    dispose(proto)
    expect(_f.__cache__).toEqual([])
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  it('requestAnimationFrame', async () => {
    const proto = {} as any

    const host = patchHost(proto, {
      scope: 'a',
    })

    const fn = compile(
      `
      window.EEE = []
      const id = requestAnimationFrame(() => {
          console.log(1)
      })
      window.EEE.push(id)
    `,
    )

    const features = getFeaturesByHost(host)
    const _f = features.find((f) => f.key === 'requestAnimationFrame')

    fn(host)

    expect(host).toBe(proto)
    expect(_f.__cache__).toEqual(proto.EEE)

    expect(proto.EEE.length).toEqual(1)
    dispose(proto)
    expect(_f.__cache__).toEqual([])
  })

  describe('ScopedStorage', () => {
    afterEach(() => {
      delete window.React
      window.localStorage.clear()
    })

    it('should be storage data at ScopedStorage', () => {
      const fn = compile(`
      window.localStorage.setItem("ax", "df")
    `)
      const sandbox = patchHost({}, {scope: 'demo0'})
      fn(sandbox)
      expect(window.localStorage.getItem('demo0')).toEqual(`{"ax":"df"}`)
      sandbox.window.localStorage.setItem('a', 'aaa')
      expect(window.localStorage.getItem('demo0')).toEqual(`{"ax":"df","a":"aaa"}`)
      expect(sandbox.window.localStorage.getItem('a')).toEqual('aaa')
    })

    it('should be sessionStorage data at ScopedStorage', () => {
      const fn = compile(`
      window.sessionStorage.setItem("ax", "df")
    `)
      const sandbox = patchHost({}, {scope: 'demo0', configs: [['sessionStorage', true]]})
      fn(sandbox)
      expect(window.sessionStorage.getItem('demo0')).toEqual(`{"ax":"df"}`)
      sandbox.window.sessionStorage.setItem('a', 'aaa')
      expect(window.sessionStorage.getItem('demo0')).toEqual(`{"ax":"df","a":"aaa"}`)
      expect(sandbox.window.sessionStorage.getItem('a')).toEqual('aaa')
      dispose(sandbox)
      expect(sandbox.window.sessionStorage).toEqual(null)
    })

    it('should be storage data at ScopedStorage without `window.`', () => {
      const fn = compile(`
      localStorage.setItem("ax", "df")
    `)
      const sandbox = patchHost({}, {scope: 'demo0'})

      fn(sandbox)
      expect(window.localStorage.getItem('demo0')).toEqual(`{"ax":"df"}`)
      sandbox.window.localStorage.setItem('a', 'aaa')
      expect(window.localStorage.getItem('demo0')).toEqual(`{"ax":"df","a":"aaa"}`)
      expect(sandbox.window.localStorage.getItem('a')).toEqual('aaa')
    })

    it('should be storage data at ScopedStorage with has old value', () => {
      window.localStorage.setItem('demo0', 'xxacacacaca')

      const fn = compile(`
      window.localStorage.setItem("ax", "df")
      window.G = localStorage.key(0)
      window.sss = localStorage.length
      `)
      const sandbox = patchHost({}, {scope: 'demo0'})
      fn(sandbox)
      expect(sandbox.G).toEqual('ax')
      expect(sandbox.sss).toEqual(1)
      expect(window.localStorage.getItem('demo0')).toEqual(`{"ax":"df"}`)
      sandbox.window.localStorage.setItem('a', 'aaa')
      expect(window.localStorage.getItem('demo0')).toEqual(`{"ax":"df","a":"aaa"}`)
      expect(sandbox.window.localStorage.getItem('a')).toEqual('aaa')

      const fn2 = compile(`window.localStorage.removeItem("ax")`)
      fn2(sandbox)
      expect(window.localStorage.getItem('demo0')).toEqual(`{"a":"aaa"}`)
      const fn3 = compile(`localStorage.clear()`)
      fn3(sandbox)
      expect(window.localStorage.getItem('demo0')).toEqual(`{}`)
    })
  })

  describe('addEventListener', () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    it('window.addEventListener', async () => {
      const proto = {} as any

      const host = patchHost(proto, {scope: 'a'})

      const fn = compile(
        `
      addEventListener("message",() => {  console.log(1)  })
      window.addEventListener("click",() => {  console.log(1)  })
      window.addEventListener("done",() => {  console.log(1)  }, false)
      addEventListener("blur",() => {  console.log(1)  }, true)
    `,
      )

      const features = getFeaturesByHost(host)
      const _f = features.find((f) => f.key === 'window.addEventListener')

      fn(host)

      expect(host).toBe(proto)
      expect(_f.__cache__.length).toEqual(4)
      expect(_f.__cache__.map((d: any[]) => d[0])).toEqual(['message', 'click', 'done', 'blur'])

      dispose(proto)
      expect(_f.__cache__).toEqual([])
    })

    // eslint-disable-next-line @typescript-eslint/require-await
    it('document.addEventListener', async () => {
      const proto = {} as any

      const host = patchHost(proto, {
        scope: 'a',
      })

      const fn = compile(
        `
      document.addEventListener("message",() => {  console.log(1)  })
      window.document.addEventListener("click",() => {  console.log(1)  })
      window.window.document.addEventListener("done",() => {  console.log(1)  }, false)
      addEventListener("blur",() => {  console.log(1)  }, true)
    `,
      )

      const features = getFeaturesByHost(host)
      const _f = features.find((f) => f.key === 'document.addEventListener')

      fn(host)

      expect(host).toBe(proto)

      expect(_f.__cache__.length).toEqual(3)
      expect(_f.__cache__.map((d: any[]) => d[0])).toEqual(['message', 'click', 'done'])

      dispose(proto)
      expect(_f.__cache__).toEqual([])
    })
  })

  it('document.cookie', () => {
    const proto = {} as any

    const host = patchHost(proto, {scope: 'a'})

    const fn = compile(
      `
      document.cookie = "AAA=111"
    `,
    )

    fn(host)

    expect(document.cookie).toEqual('@@a|AAA=111')
    expect(host.document.cookie).toEqual(`AAA=111`)

    const fn2 = compile(
      `
      window.document.cookie = "AAA=2222"
    `,
    )

    fn2(host)

    expect(document.cookie).toEqual('@@a|AAA=2222')
    expect(host.document.cookie).toEqual(`AAA=2222`)

    dispose(host)

    expect(document.cookie).toEqual('')
    expect(host.document.cookie).toEqual('')
  })

  describe('document.write', () => {
    it('document.write without config', () => {
      const proto = {} as any

      runScript(` document.write("<h2>Main</h2>")  `, proto, {
        scope: 'a',
      })
      expect(document.body.innerHTML).toEqual('')
      document.write('<h1>Main</h1>')
      expect(document.body.innerHTML).toEqual('<h1>Main</h1>')
    })

    it('document.write with config `false`', () => {
      const host = {} as any
      runScript(`document.write("<h2>Main title</h2>") `, host, {
        scope: 'a',
        configs: [['document.write', false]],
      })
      expect(document.body.innerHTML).toEqual('<h2>Main title</h2>')
    })
  })

  describe('eval', () => {
    it('eval script with the original eval', () => {
      const fn = compile(`window.aaaa = eval("window.x = 9;eee=13; x + eee * x - 1")`)

      const oo = {} as any
      fn(oo)
      expect(oo.aaaa).toEqual(125)
      expect(oo.x).toEqual(9)
      expect(window.eee).toEqual(13)
    })

    it('eval script with the fake eval', () => {
      const oo = {} as any
      const nn = runScript(`module.exports = window.aaaa = eval("window.x = 9;fff=13;") `, oo, {
        scope: 'K',
        wrap,
        configs: ['eval', true],
      })

      expect(nn).toEqual(undefined)
      expect(oo.x).toEqual(9)
      expect(oo.aaaa).toEqual(undefined)
      expect(window.fff).toEqual(13)

      dispose(oo)
    })

    it('eval script with the real eval', () => {
      const oo = {} as any
      const nn = runScript(`module.exports = window.aaaa = eval("window.x = 9;fff=13;") `, oo, {
        scope: 'K',
        wrap,
      })

      expect(nn).toEqual(13)
      expect(oo.x).toEqual(9)
      expect(oo.aaaa).toEqual(13)
      expect(window.fff).toEqual(13)
    })
  })
})
