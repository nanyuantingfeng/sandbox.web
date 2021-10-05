/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {mock, makeMockDir, readFile, makeURLError, CDN} from './fixtures/mock'
import {dispose, runScript, IFeatureCreator} from '../src'

function wrap(script: string): string {
  return ` 
              var module = {exports : {}};
              var exports = module.exports;
              ${script}
              return module.exports;
             `
}

function cases(mode?: 'inline' | 'anonymous') {
  describe('runScript', () => {
    it('should be intercept variable with proto', () => {
      const proto = {
        E: 20,
        aaa: {},
      }
      runScript(
        `
      aaa.c = 9
      E = 13
      window.E += 14
    `,
        proto,
        {
          mode,
          scope: 'a',
        },
      )
      expect((proto as any).window.E).toEqual(27)
      expect(proto.aaa).toEqual({c: 9})
    })

    it('should be run evalScript', () => {
      const sandbox = {} as any
      runScript(`window.sss = 99999; document.U = {i : 3}; `, sandbox, {
        mode,
        scope: 'demo7',
      })

      expect(sandbox.window.sss).toEqual(99999)
      expect(sandbox.window.window.sss).toEqual(99999)
      expect(sandbox.document.U).toEqual({i: 3})
      expect((window as any).sss).toEqual(undefined)
      expect((document as any).U).toEqual(undefined)
    })

    it('should be run with runScript', () => {
      const sandbox = {} as any
      runScript(`window.G = 99`, sandbox, {mode, scope: 'ASD'})
      expect(sandbox.window.G).toEqual(99)

      runScript(`window.sss = 99999; document.U = {i : 3}; `, sandbox)

      expect(sandbox.window.G).toEqual(99)
      expect(sandbox.window.sss).toEqual(99999)
      expect(sandbox.document.U).toEqual({i: 3})
      expect((window as any).sss).toEqual(undefined)
      expect((document as any).U).toEqual(undefined)

      dispose(sandbox)
    })

    it('should be run runScript with featureCreators', () => {
      const _feature: IFeatureCreator<any> = (options) => {
        return {
          key: 'X',
          install: () => {
            options.$window.pow = function (n: number) {
              return n * n
            }
          },
          dispose: () => {
            options.$window.pow = undefined
          },
        }
      }
      const host = {} as any
      const oo = runScript(
        `
      window.sss = window.pow(8);
      window.SSS = pow(11);
      module.exports = window.sss - SSS
    `,
        host,
        {scope: 'U', wrap, mode, featureCreators: [_feature]},
      )

      expect('sss' in host.window).toBeTruthy()
      expect('window' in host).toBeTruthy()
      expect(host.window.sss).toEqual(64)
      expect(host.window.SSS).toEqual(121)
      expect(oo).toEqual(64 - 121)
    })

    it('should be proxy to the original object by `in`', () => {
      const host = {} as any
      runScript(
        `
      window.G = 'navigator' in window
      window.F = 'location' in document
    `,
        host,
        {scope: 'U', mode},
      )
      expect(host.window.G).toBeTruthy()
      expect(host.window.F).toBeTruthy()
      expect('navigator' in host.window).toBeTruthy()
      expect('location' in host.document).toBeTruthy()
    })
  })

  describe('document', () => {
    it('should be intercept variable', () => {
      const sandbox = {} as any
      runScript(
        `
      document.a = {a : 1}
      document.b = {b : 1}
    `,
        sandbox,
        {mode, scope: 'demo0'},
      )

      expect(sandbox.document.a).toEqual({a: 1})

      expect(sandbox.document.b).toEqual({b: 1})
    })

    it('should be through global variable', () => {
      ;(document as any).React = {version: '20.0'}
      const sandbox = {} as any
      const oo = runScript(
        `
      document.React.ccccc = 'cccccccccc'
      module.exports = document.React.version + '55555'
    `,
        sandbox,
        {mode, wrap, scope: 'demo0'},
      )

      expect(oo).toEqual('20.055555')

      expect((document as any).React.ccccc).toEqual('cccccccccc')

      expect(sandbox.document.React.ccccc).toEqual('cccccccccc')
    })

    it('should be createElement at script', async () => {
      const sandbox: any = {__id: Math.random()}

      runScript(
        `
     window.G = 99
     var script = document.createElement('script')
     script.id ="a0"
     script.innerHTML = "window.sss = 99999; document.U = {i : 3};"
     document.body.appendChild(script)
     window.G = script.innerHTML
    `,
        sandbox,
        {mode, scope: 'demo7'},
      )

      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(sandbox.window.G).toEqual(`window.sss = 99999; document.U = {i : 3};`)
      expect(sandbox.window.sss).toEqual(99999)
      expect(sandbox.document.U).toEqual({i: 3})
      expect((window as any).sss).toEqual(undefined)
      expect((document as any).U).toEqual(undefined)

      expect(document.getElementById('a0')).toBeTruthy()
      dispose(sandbox)
      expect(document.getElementById('a0')).toEqual(null)
    })

    it('should be createElement at script run once', async () => {
      const sandbox: any = {__id: Math.random()}

      runScript(
        `
     window.sss = 1
     var script = document.createElement('script')
     script.id ="a0"
     script.innerHTML = "window.sss += 1"
     document.body.appendChild(script)
     setTimeout(() => {
           document.body.appendChild(document.createElement('div'))
           document.body.appendChild(document.createElement('div'))
           document.body.appendChild(document.createElement('div'))
           document.body.appendChild(document.createElement('div'))
           const e = document.createElement('div')
           e.id="a1"
           document.body.appendChild(e)
     }, 1000)

    `,
        sandbox,
        {mode, scope: 'demo7'},
      )

      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(sandbox.window.sss).toEqual(2)
      await new Promise((resolve) => setTimeout(resolve, 1200))
      expect(document.body.childNodes.length).toBe(6)
      expect(document.getElementById('a0')).toBeTruthy()
      expect(document.getElementById('a1')).toBeTruthy()
      document.body.removeChild(document.getElementById('a1'))
      expect(document.getElementById('a1')).toBeFalsy()
      dispose(sandbox)
      expect(document.getElementById('a0')).toEqual(null)
      expect(document.body.childNodes.length).toBe(0)
    })

    it('should be createElement with other tagName', async () => {
      const sandbox: any = {__id: Math.random()}

      runScript(
        `
     var div = document.createElement('div')
     div.id ="a0"
     div.textContent = "window.sss = 99999; document.U = {i : 3};"
     document.body.appendChild(div)
     window.G = div.textContent
    `,
        sandbox,
        {mode, scope: 'demo7'},
      )

      await new Promise((resolve) => setTimeout(resolve, 200))
      const ele = document.getElementById('a0')
      expect(ele).toBeTruthy()
      expect(ele.textContent).toEqual(sandbox.window.G)
      dispose(sandbox)
      expect(document.getElementById('a0')).toEqual(null)
    })

    it('should be createElement script with src', async () => {
      mock.setup()
      makeURLError('https://xxx/xxx', 'ERRRRRRRRRRRR')

      const sandbox: any = {__id: Math.random()}

      const oo = runScript(
        `
         var script = document.createElement('script')
         script.id ="a0"
         script.src ="https://xxx/xxx"
         document.body.appendChild(script)

         module.exports = [
          script.getAttribute("id"),
          script.getAttribute("src"),
         ]
    `,
        sandbox,
        {mode, wrap},
      )

      expect(oo[0]).toEqual('a0')
      expect(oo[1]).toEqual('https://xxx/xxx')

      await new Promise((resolve) => setTimeout(resolve, 200))
      const ele = document.getElementById('a0')
      expect(ele).toBeTruthy()
      expect(ele.getAttribute('src')).toEqual('https://xxx/xxx')
      dispose(sandbox)
      expect(document.getElementById('a0')).toEqual(null)

      mock.teardown()
    })

    it('should be createElement at script no code', async () => {
      const sandbox: any = {__id: Math.random()}

      runScript(
        `
     var script = document.createElement('script')
     script.id ="a0"
     document.body.appendChild(script)
    `,
        sandbox,
        {scope: 'demo7', mode},
      )
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(document.getElementById('a0')).toBeTruthy()
      dispose(sandbox)
      expect(document.getElementById('a0')).toEqual(null)
    })

    it('should be `Object.keys(document)`', () => {
      const host = {}
      const oo: string[] = runScript(
        `
      module.exports = [
        Object.getOwnPropertyNames(document),
        Object.keys(window.document),
        'location' in document,
         Object.getOwnPropertySymbols(document),
         'ssssss' in document
      ]
       `,
        host,
        {mode, wrap},
      )
      expect(oo[0].includes('location')).toBeTruthy()
      expect(oo[1].includes('location')).toBeTruthy()
      expect(oo[2]).toBeTruthy()
      expect(oo[3]).toBeInstanceOf(Array)
      expect(oo[4]).toBeFalsy()
    })

    it('should be createElement at script src', async () => {
      const oo = runScript(
        `
             var script = document.createElement('script')
             script.setAttribute('src', 'https://cdn.bootcdn.net/ajax/libs/react/17.0.2/umd/react.production.min.js')
             document.head.appendChild(script)
          module.exports = window
        `,
        {},
        {mode, wrap},
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(oo.React).toBeInstanceOf(Object)
      expect(oo.React.createElement).toBeInstanceOf(Function)
    })

    it('should be createElement at script src use append', async () => {
      const oo = runScript(
        `
             var script = document.createElement('script')
             script.setAttribute('src', 'https://cdn.bootcdn.net/ajax/libs/react/17.0.2/umd/react.production.min.js')
             document.head.append(script)
          module.exports = window
        `,
        {},
        {mode, wrap},
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(oo.React).toBeInstanceOf(Object)
      expect(oo.React.createElement).toBeInstanceOf(Function)
    })

    it('should be createElement at script src use insertBefore', async () => {
      const oo = runScript(
        `
             var script = document.createElement('script')
             script.setAttribute('src', 'https://cdn.bootcdn.net/ajax/libs/react/17.0.2/umd/react.production.min.js')
             document.head.insertBefore(script)
          module.exports = window
        `,
        {},
        {mode, wrap},
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(oo.React).toBeInstanceOf(Object)
      expect(oo.React.createElement).toBeInstanceOf(Function)
    })
  })

  describe('issues', () => {
    it('the constructor as function', () => {
      runScript(`new MutationObserver(() => {})`, {}, {scope: 'a', mode})
      runScript(
        `new window.MutationObserver(() => {})`,
        {},
        {
          scope: 'a',
          mode,
        },
      )
      runScript(
        `new global.MutationObserver(() => {})`,
        {},
        {
          scope: 'a',
          mode,
        },
      )
    })

    it('eqeqeq', () => {
      expect(
        runScript(
          `module.exports = [
        fetch === fetch,
        window.fetch === window.fetch,
        A === window.A,
        global.A === window.A,
        A === fetch
      ]`,
          {
            fetch: function () {
              return 'fetch'
            },
            A: function () {
              return 'A'
            },
          },
          {mode, scope: 'a', wrap},
        ),
      ).toEqual([true, true, true, true, false])

      function K() {}

      expect(
        runScript(
          `module.exports = [
        fetch === fetch,
        fetch === window.fetch,
        A === window.A,
        global.A === window.A,
        A === fetch
      ]`,
          {
            fetch: K,
            A: K,
          },
          {mode, scope: 'a', wrap},
        ),
      ).toEqual([true, true, true, true, true])

      expect(
        runScript(
          `module.exports = [
        document.getElementById === document.getElementById,
        window.fetch === window.fetch,
        setTimeout === window.setTimeout,
      ]`,
          {},
          {mode, scope: 'a', wrap},
        ),
      ).toEqual([true, true, true])

      // @ts-ignore
      window.fetch = function () {}

      expect(
        runScript(
          `module.exports = [
        global.fetch === window.fetch,
      ]`,
          {},
          {mode, scope: 'a', wrap},
        ),
      ).toEqual([true])

      expect(
        runScript(
          `module.exports = [
        document === window.document,
        global.document === window.document,
      ]`,
          {},
          {mode, scope: 'a', wrap},
        ),
      ).toEqual([true, true])
    })

    it('eqeqeq for fetch', () => {
      ;(window as any).fetch = function () {}

      expect(
        runScript(
          `
      module.exports = fetch === window.fetch `,
          {},
          {mode, scope: 'a', wrap},
        ),
      ).toBeTruthy()
    })

    it('document property method', () => {
      runScript(
        `
        var sss = document.querySelector
        sss("#q")
      `,
        {},
        {mode, scope: 'a'},
      )

      runScript(
        `
        var sss = document.querySelectorAll
        sss("#q")
      `,
        {},
        {mode, scope: 'a'},
      )
    })

    it('override global', () => {
      expect(
        runScript(
          `
        window.window = 4
        module.exports = window
      `,
          {},
          {mode, scope: 'a', wrap},
        ),
      ).toBeTruthy()
    })

    it('Object.keys(window)', () => {
      const oo = runScript(
        `
        window.____AAAAAA___ = 9
        module.exports = [
          Object.getOwnPropertyNames(window.window),
          Object.keys(window.window),
          '____AAAAAA___' in window,
          Object.getOwnPropertySymbols(window)
        ]
      `,
        {},
        {mode, scope: 'a', wrap},
      )
      expect(oo[0].length > 200).toBeTruthy()
      expect(oo[1]).toContain('____AAAAAA___')
      expect(oo[2]).toBeTruthy()
      expect(oo[3].length > 6).toBeTruthy()
    })

    it('document.cookie', () => {
      const host_demo1 = {}
      expect(
        runScript(
          `
      document.cookie = { a : { b : 1} , c : {d : false}}
      module.exports = document.cookie
    `,
          host_demo1,
          {mode, scope: 'demo', wrap},
        ),
      ).toEqual(`=[object Object]`)

      expect(document.cookie).toEqual(`@@demo|=[object Object]`)
      const host_demo2 = {} as any
      expect(
        runScript(
          `
      document.cookie = "A=1&A=2&A=3"
      module.exports = document.cookie
    `,
          host_demo2,
          {mode, scope: 'demo2', wrap},
        ),
      ).toEqual(`A=1&A=2&A=3`)
      expect(document.cookie).toEqual(`@@demo|=[object Object]; @@demo2|A=1&A=2&A=3`)
      const host_demo3 = {}
      expect(
        runScript(
          `
      document.cookie = [1,2,3]
      module.exports = document.cookie
    `,
          host_demo3,
          {mode, scope: 'demo3', wrap},
        ),
      ).toEqual(`=1,2,3`)

      expect(document.cookie).toEqual(`@@demo|=[object Object]; @@demo2|A=1&A=2&A=3; @@demo3|=1,2,3`)

      expect(
        runScript(
          `
      document.cookie = JSON.stringify(JSON.stringify({A : 1}))
      module.exports = document.cookie
    `,
          {},
          {mode, scope: 'demo', wrap},
        ),
      ).toEqual(`="{\\"A\\":1}"`)

      expect(
        runScript(
          `
      document.cookie = "\\"x"
      module.exports = document.cookie
    `,
          {},
          {mode, scope: 'demo', wrap},
        ),
      ).toEqual(`="x`)

      document.cookie = `DX=d029d815-1c4d-4c8b-980e-9d7c4b72489a3c42ed; _octo=GH1.1.1314413289.1608723004; tz=Asia%2FShanghai`
      const host = {} as any
      expect(
        runScript(
          `
      document.cookie = [1,2,3]
      module.exports = document.cookie
    `,
          host,
          {mode, scope: 'demo', wrap},
        ),
      ).toEqual(`=1,2,3`)

      expect(document.cookie).toEqual(
        `@@demo|=1,2,3; @@demo2|A=1&A=2&A=3; @@demo3|=1,2,3; DX=d029d815-1c4d-4c8b-980e-9d7c4b72489a3c42ed`,
      )
      dispose(host)
      expect(document.cookie).toEqual(
        `@@demo2|A=1&A=2&A=3; @@demo3|=1,2,3; DX=d029d815-1c4d-4c8b-980e-9d7c4b72489a3c42ed`,
      )
      dispose(host_demo1)
      runScript(
        `document.cookie="BB=1";document.cookie="CC=false";document.cookie="EE=9982; expires=-1; Max-age=0";`,
        host_demo2,
      )
      expect(document.cookie).toEqual(
        `@@demo2|A=1&A=2&A=3; @@demo3|=1,2,3; DX=d029d815-1c4d-4c8b-980e-9d7c4b72489a3c42ed; @@demo2|BB=1; @@demo2|CC=false`,
      )
      expect(host_demo2.document.cookie).toEqual(`A=1&A=2&A=3; BB=1; CC=false`)
      dispose(host_demo2)
      expect(document.cookie).toEqual(`@@demo3|=1,2,3; DX=d029d815-1c4d-4c8b-980e-9d7c4b72489a3c42ed`)
      dispose(host_demo3)
      expect(document.cookie).toEqual(`DX=d029d815-1c4d-4c8b-980e-9d7c4b72489a3c42ed`)
    })

    it('Object.getOwnPropertyDescriptor(window)', () => {
      const oo = runScript(
        `
        window.S = { U : {}}

        module.exports = [
          Object.getOwnPropertyDescriptors(window),
          Object.getOwnPropertyDescriptor(window, 'window'),
          Object.getOwnPropertyDescriptor(window, 'xxxxxx'),
          Object.getOwnPropertyDescriptor(window, 'S'),
          Object.getOwnPropertyDescriptor(window.S, 'U'),
          Object.getOwnPropertyDescriptors(window.S),
        ]
      `,
        {},
        {mode, wrap},
      )

      expect(oo[0]).toBeInstanceOf(Object)
      expect(oo[0].StyleSheet).toBeInstanceOf(Object)
      expect(oo[0].onmessage).toBeInstanceOf(Object)

      expect(oo[1]).toBeInstanceOf(Object)
      expect(oo[2]).toBeUndefined()
      expect(oo[3]).toBeInstanceOf(Object)
      expect(oo[4]).toBeInstanceOf(Object)
      expect(oo[5]).toBeInstanceOf(Object)
    })

    it('this === window', () => {
      expect(
        runScript(
          `module.exports = [
        this === window,
      ]`,
          {},
          {mode, wrap},
        ),
      ).toEqual([true])
    })
  })

  describe('webpack async chunks', () => {
    beforeEach(() => mock.setup())
    afterEach(() => mock.teardown())

    it('async chunk', async () => {
      makeMockDir('example0')

      const oo = runScript(readFile('example0', 'demo-9735fe32.js'), {}, {mode, wrap})

      expect(oo.aaaa).toBeInstanceOf(Function)
      await expect(oo.aaaa('default')).resolves.toEqual('1111XXXX')
      await expect(oo.aaaa('demo0')).resolves.toEqual('9999XXXX')
      await expect(oo.aaaa('demo1')).resolves.toEqual('8888XXXX')
      await expect(oo.aaaa('demo2')).resolves.toEqual('7777XXXX')

      const cWin = await oo.cWin()
      const gWin = oo.win()
      expect(gWin === cWin).toBeTruthy()
      expect(gWin === window).toBeFalsy()
    })

    it('async chunk + React/ReactDOM', async () => {
      makeMockDir('example1')
      const oo = runScript(readFile('example1', 'demo-555721d7.js'), {}, {mode, wrap})
      expect(oo).toBeInstanceOf(Object)

      oo.setup()

      await new Promise((resolve) => setTimeout(resolve, 16))
      expect(document.body.innerHTML).toMatchSnapshot()
      expect(document.body.innerHTML.indexOf(`<h2>Hello :-)</h2>`)).toBe(61)
    })

    it('async chunk + React/ReactDOM + createElement(`script`)', async () => {
      makeMockDir('example2')

      runScript(
        `
         var script = document.createElement('script')
         script.src = "${CDN}/demo-22476468.js"
         document.head.appendChild(script)
      `,
        {},
        {mode, wrap},
      )

      await new Promise((resolve) => setTimeout(resolve, 16))
      expect(document.body.innerHTML).toMatchSnapshot()
      expect(document.body.innerHTML.indexOf(`<h2>Hello :-)</h2>`)).toBe(61)
    })
  })
}

function deleteAllCookies() {
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

describe('runScript with mode', () => {
  afterEach(() => {
    /**
     * Jest JSDOM 并不会自动重置实例,
     * 所以每一次都需要手动清除测试的临时资源, 避免污染
     */
    delete (window as any).sss
    delete (window as any).eee
    delete (window as any).fff
    delete (window as any).SSS
    delete (window as any).S
    delete (window as any).React
    delete (window as any).document.U
    delete (window as any).G
    delete (window as any).E

    deleteAllCookies()
    document.getElementsByTagName('html')[0].innerHTML = ''
  })

  describe('anonymous', () => {
    cases()
  })

  describe('inline', () => {
    cases('inline')
  })

  describe('without mode', () => {
    beforeEach(() => mock.setup())
    afterEach(() => mock.teardown())

    describe('webpack async chunks', () => {
      it('async chunk', async () => {
        makeMockDir('example0')

        const oo = runScript(readFile('example0', 'demo-9735fe32.js'), {}, {wrap})

        expect(oo.aaaa).toBeInstanceOf(Function)
        await expect(oo.aaaa('default')).resolves.toEqual('1111XXXX')
        await expect(oo.aaaa('demo0')).resolves.toEqual('9999XXXX')
        await expect(oo.aaaa('demo1')).resolves.toEqual('8888XXXX')
        await expect(oo.aaaa('demo2')).resolves.toEqual('7777XXXX')

        const cWin = await oo.cWin()
        const gWin = oo.win()
        expect(gWin === cWin).toBeTruthy()
        expect(gWin === window).toBeFalsy()
      })

      it('async chunk + React/ReactDOM', async () => {
        makeMockDir('example1')
        const oo = runScript(readFile('example1', 'demo-555721d7.js'), {}, {wrap})
        expect(oo).toBeInstanceOf(Object)

        oo.setup()

        await new Promise((resolve) => setTimeout(resolve, 16))
        expect(document.body.innerHTML).toMatchSnapshot()
        expect(document.body.innerHTML.indexOf(`<h2>Hello :-)</h2>`)).toBe(61)
      })

      it('async chunk + React/ReactDOM + createElement(`script`)', async () => {
        makeMockDir('example2')

        runScript(`
         var script = document.createElement('script')
         script.src = "${CDN}/demo-22476468.js"
         document.head.appendChild(script)
      `)

        await new Promise((resolve) => setTimeout(resolve, 16))
        expect(document.body.innerHTML).toMatchSnapshot()
        expect(document.body.innerHTML.indexOf(`<h2>Hello :-)</h2>`)).toBe(61)
      })
    })
  })
})
