/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import {compile} from './compile'
import {$PatchedHost, IPatchHostOptions} from '../types'

type $Host = $PatchedHost<Record<string, any>> | Record<string, any>

export function runScript<T = any>(code: string, host: $Host, options: IPatchHostOptions): T
export function runScript<T = any>(code: string, host: $Host): T
export function runScript<T = any>(code: string): T
export function runScript<T = any>(code: string, host: any = {}, options?: IPatchHostOptions): T {
  return compile(code)(host, options)
}
