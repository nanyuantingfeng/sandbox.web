# sandbox.web

> Independent sandbox implementation, provides features configuration,
> It adopts Proxy/Proto dual mode, which is automatically selected according to the client environment in case of no special configuration

## Installation

```shell
npm i sandbox.web
```

## Usage

> example

```typescript
import {runScript} from 'sandbox.web'

const code = `window.OO = 1`
const host = {}
runScript(code, host, {scope: 'xxxx'})

// host.window.OO => 1
```

## API

- `runScript(code, host?: object, options?) : any` Used to execute CommonJS code
  - `code :string`
  - `host ?:object` To provide a global object is the host, the inside of the code window/global/globalThis/self reference will be redirected to the object
  - `options?:object`
    - `scope?:string` This field is required
      In localStorage/sessionStorage/cookie, data will be written to this key
    - `configs?:Array<IFeatureConfigure>` config features
    - `wrap?: (code: string) => string` wrap original code 
    - `featureCreators?: Array<IFeatureCreator>` external features
    - `mode?: 'inline' | 'anonymous'`  sandbox mode, 默认值 `anonymous`
      - `inline` : create the execution mode using `document.createElement('script')`
      - `anonymous` : use `new Function()` to create the execution mode

> example configs

```typescript
import {runScript} from 'sandbox.web'

const code = `
      setTimeout(() => {
       //.....
      }, 3000)
      
      document.cookie = 1111
    `
const host = {}
const configs = [
  ['document.cookie', false],
  ['setTimeout', false],
]
const result = runScript(code, host, {configs})

// In this demo, the setTimeout/cookie call will perform window native
// setTimeout/cookie, the sandbox will give up processing the corresponding feature
```

> example wrap code

```typescript
import {runScript} from 'sandbox.web'

function wrap(code){
  return `
    var module = {exports : {}}
    var exports = module.exports
    ${code}
    return module.exports
  `
}

const coode = ` 
    module.exports = [1,2,3]
 `
const result = runScript(code, {}, {wrap})
// result === [1,2,3]
//In this DEMO, the code can use code similar to the CommonJS specification
```


- `dispose(host) : void` clear the sandbox corresponding to the current host

  > Calling this method will clear side effects in host, and dispose method of all features will be called internally to perform the cleaning operation

- `getFeaturesByHost(host) : Array<Feature>` Obtain all feature instances stored in the sandbox corresponding to host

- `setDisposer(host, fn) : void` Set additional cleanup methods, fn will be called together with dispose call

- `setDisposeErrorHandler(host, fn) : void` Set up a catch error method to catch the Dispose method

- `setupAdapter(adapter: 'proxy' | 'proto' | 'auto') : void` Force the running mode to be specified
  - default : 'auto'

## `supported features`

- `window.addEventListener`
- `document.addEventListener`
- `document.createElement`
- `document.cookie`
- `document.write`
- `eval` : [disabled by default]
- `localStorage`
- `requestAnimationFrame`
- `sessionStorage` : [disabled by default]
- `setInterval`
- `setTimeout`

## `Custom Feature`

> example custom features

```typescript
import {runScript, IFeatureCreator} from 'sandbox.web'

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

const code = ` return window.pow(33) `
const result = runScript(code, {}, {featureCreators: [_feature]})
// result === 33 * 33
// In this demo, the `window.pow` call will execute the function defined in `_feature`
```

### IFeatureCreator : (options: IOptions) => IFeature

> typing

```typescript
type IFeatureCreator<W = Window, D = Document> = (options: {
  $window: $PatchedHost<W>
  $document: D
  scope: string
}) => IFeature

interface IFeature {
  key: string
  install: (config?: Record<string, any> | boolean | string | null) => any
  dispose: () => void
  defaultOptions?: boolean | Record<string, any>
}


type IFeatureConfigureCommon = [string, Record<string, any> | boolean | string | null]
type IFeatureConfigure = string | [string] | IFeatureConfigureCommon
```
