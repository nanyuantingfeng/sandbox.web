/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
export function wrapCode(code: string, wrap?: (code: string) => string): string {
  return `with(capture) {
            with(__proxy__) {
              ${wrap ? wrap(code) : code}
            }
          }`
}
