/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
const FAKE_WIN_CELLAR = new WeakSet<any>()

const __Object_keys = Object.keys
const __Object_getOwnPropertyNames = Object.getOwnPropertyNames
const __Object_getOwnPropertySymbols = Object.getOwnPropertySymbols
const __Object_getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors
const __Object_getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor

/****
 * In order to fix the sandbox execution of each of the following
 * apis being closer to the original API call,
 * an override strategy is used here
 */
Object.keys = function (o: object): string[] {
  if (!FAKE_WIN_CELLAR.has(o)) return __Object_keys(o)
  return Array.from(new Set(__Object_keys(window).concat(__Object_keys(o))))
}

Object.getOwnPropertyNames = function (o: any): string[] {
  if (!FAKE_WIN_CELLAR.has(o)) return __Object_getOwnPropertyNames(o)
  return Array.from(new Set(__Object_getOwnPropertyNames(window).concat(__Object_getOwnPropertyNames(o))))
}

Object.getOwnPropertySymbols = function (o: any): symbol[] {
  if (!FAKE_WIN_CELLAR.has(o)) return __Object_getOwnPropertySymbols(o)
  return Array.from(new Set(__Object_getOwnPropertySymbols(window).concat(__Object_getOwnPropertySymbols(o))))
}

Object.getOwnPropertyDescriptors = function <T>(
  o: T,
): {[P in keyof T]: TypedPropertyDescriptor<T[P]>} & {[x: string]: PropertyDescriptor} {
  if (!FAKE_WIN_CELLAR.has(o)) return __Object_getOwnPropertyDescriptors(o)
  return Object.assign(__Object_getOwnPropertyDescriptors(window), __Object_getOwnPropertyDescriptors(o))
}

Object.getOwnPropertyDescriptor = function (o: any, p: PropertyKey): PropertyDescriptor {
  if (!FAKE_WIN_CELLAR.has(o)) return __Object_getOwnPropertyDescriptor(o, p)
  return __Object_getOwnPropertyDescriptor(o, p) || __Object_getOwnPropertyDescriptor(window, p)
}

export function registerOwnsFixer(object: any) {
  return FAKE_WIN_CELLAR.add(object)
}
