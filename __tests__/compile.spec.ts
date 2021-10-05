/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
// @ts-nocheck
import {compile, patchHost, runScript} from '../src'

/*
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

describe('compile', () => {
  it('should be intercept variable', () => {
    const fn = compile(`
      aaaa.a = {a : 1}
      aaaa.b = {b : 1}
    `)

    const aaaa = {}
    fn({aaaa})
    expect(aaaa).toEqual({
      a: {a: 1},
      b: {b: 1},
    })
  })

  it('should be through global variable', () => {
    const fn = compile(`module.exports = window.React.version + '44444'`)
    const gg = {
      React: {
        react: 0,
        version: 1,
      },
    }
    const oo = fn(gg, {wrap})
    expect(oo).toEqual('144444')
  })

  it('should be runScript at script 0', () => {
    const fn = compile(`
    window.sss = 99999;
    globalThis.SSS = sss
    self.S =  SSS * sss
    `)
    const gg = {} as any
    fn(gg)

    expect(gg.window).toBe(gg.window.window)

    expect(gg.sss).toEqual(99999)
    expect(gg.SSS).toEqual(99999)
    expect(gg.S).toEqual(9999800001)

    expect(window.sss).toEqual(undefined)

    expect(globalThis.SSS).toEqual(undefined)

    expect(self.S).toEqual(undefined)
  })

  it('should be runScript at script 1', () => {
    window.sss = 888
    const fn = compile(
      `
    window.sss +=1;
    globalThis.SSS = sss
    self.S =  SSS * sss
    `,
    )

    const oo = {sss: window.sss} as any
    fn(oo)

    expect(oo.window.window).toBe(oo.window)

    expect(oo.sss).toEqual(889)
    expect(oo.SSS).toEqual(889)
    expect(oo.S).toEqual(889 * 889)
    expect(window.sss).toEqual(888)
    expect(globalThis.SSS).toEqual(undefined)
    expect(self.S).toEqual(undefined)
  })

  it('should be runScript at script 2', () => {
    const fn = compile(`
    window.ss0  = window === global
    window.ss1  = window === globalThis
    window.ss2  = window === self
    window.ss3  = window === window.window
    window.ss4  = self === globalThis.window
    `)

    const oo = {} as any
    fn(oo)

    expect(oo.ss0).toBe(true)
    expect(oo.ss1).toBe(true)
    expect(oo.ss2).toBe(true)
    expect(oo.ss3).toBe(true)
    expect(oo.ss4).toBe(true)
  })

  it('should be runScript at script 3', () => {
    window.SSS = {sss: 999}
    const fn = compile(
      `
    window.ss0  = window.SSS.sss + 1
    window.ss1  = window.window.SSS.sss + 2
    window.SSS.sss += 3
    `,
    )

    const oo = {SSS: window.SSS} as any
    fn(oo)

    expect(oo.ss0).toBe(1000)
    expect(oo.ss1).toBe(1001)

    expect(window.SSS.sss).toBe(1002)
  })

  it('should be runScript at script 4', () => {
    window.UUU = {}
    const fn = compile(`
      window.aaaaaa = String({})
      window.bbbbbb = false
      window.cccccc = JSON.stringify(window.UUU)
    `)

    const oo = {UUU: 999} as any
    fn(oo)
    expect(oo.aaaaaa).toBe('[object Object]')
    expect(oo.bbbbbb).toBe(false)
    expect(oo.cccccc).toBe('999')
  })

  it('should be runScript at script 5', () => {
    window.UUU = {}
    const fn = compile(`
      window.aaaa = window.String("xxxxxxx")
      window.bbbb = aaaa.replace(/x/g, "y")
    `)

    const oo = {} as any
    fn(oo)
    expect(oo.aaaa).toBe('xxxxxxx')
    expect(oo.bbbb).toBe('yyyyyyy')
    expect(window.aaaa).toBeFalsy()
    expect(window.bbbb).toBeFalsy()
  })

  it('should be transparent for Symbol', () => {
    window.UUU = {}
    const fn = compile(`
      window.aaaa = Symbol("xxxxxxx")
      window.cccc = global.Symbol("xxxxxxx")
      window.bbbb = Symbol.for("xxxxxxx")
      window.bbbb = globalThis.Symbol.for("xxxxxxx")
    `)

    const oo = {} as any
    fn(oo)
    expect(oo.aaaa).toBeTruthy()
    expect(oo.cccc).toBeTruthy()
    expect(oo.bbbb).toBeTruthy()
  })

  it('should be transparent for Symbol 2', () => {
    const oo = {} as any
    window.UUU = {}
    runScript(
      `
      window.aaaa = Symbol("xxxxxxx")
      window.cccc = global.Symbol("xxxxxxx")
      window.bbbb = Symbol.for("xxxxxxx")
      window.bbbb = globalThis.Symbol.for("xxxxxxx")
    `,
      oo,
      {
        scope: 'M',
      },
    )

    expect(oo.aaaa).toBeTruthy()
    expect(oo.cccc).toBeTruthy()
    expect(oo.bbbb).toBeTruthy()
  })

  it('should be transparent ===', () => {
    window.UUU = {}
    const fn = compile(`
      window.aaaa = document === window.document
      window.bbbb = window === window.window
    `)

    const oo = {} as any
    fn(oo)
    expect(oo.aaaa).toBeTruthy()
    expect(oo.bbbb).toBeTruthy()
  })

  it('should be intercept variable to original window', () => {
    const fn = compile(`
      window.a = {a : 1}
      window.b = {b : 1}
    `)
    const sandbox = patchHost({}, {scope: 'demo0'})
    fn(sandbox)
    expect(sandbox.window.a).toEqual({a: 1})
    expect(sandbox.window.b).toEqual({b: 1})
  })

  it('should be through global variable to original window', () => {
    window.React = {version: '20.0'}
    const fn = compile(`
      window.React.ccccc = '989898989'
      module.exports = window.React.version + '44444'
    `)
    const sandbox = patchHost({}, {scope: 'demo0'})
    const oo = fn(sandbox, {wrap})
    expect(oo).toEqual('20.044444')
    expect(window.React.ccccc).toEqual('989898989')
  })
})
