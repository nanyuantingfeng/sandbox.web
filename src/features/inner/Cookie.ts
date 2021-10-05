/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/

function decode(s: string): string {
  return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent)
}

function parseOne(s: string): [string, string] {
  const parts = s.split('=')
  // 如果没有找到`=`就直接赋值默认key("")
  // 此为原生API行为
  if (parts.length === 1) return ['', s]

  return [decode(parts[0]), decode(parts.slice(1).join('='))]
}

function parse(): Record<string, string> {
  // To prevent the for loop in the first place assign an empty array
  // in case there are no cookies at all.
  const cookies = document.cookie ? document.cookie.split('; ') : []
  return cookies.map(parseOne).reduce((a, b) => ((a[b[0]] = b[1]), a), {} as any)
}

function keys(scope: string): string[] {
  const kk = document.cookie
    .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '')
    .split(/\s*(?:\=[^;]*)?;\s*/)
  for (let i = 0; i < kk.length; i++) {
    kk[i] = decodeURIComponent(kk[i])
  }
  return kk.filter((k) => k.startsWith(`@@${scope}|`))
}

export function set(scope: string, value: string): void {
  const [k, v] = parseOne(value)
  document.cookie = `@@${scope}|${k}=${v}`
}

export function remove(scope: string): void {
  keys(scope).forEach((k) => (document.cookie = `${k}=; Max-Age=0; expires=-1`))
}

export function get(scope: string): string {
  const oo = parse()
  return keys(scope)
    .map((k) => `${k.slice(scope.length + 3)}=${oo[k]}`)
    .join('; ')
}

const Cookie = {set, get, remove}

export default Cookie
