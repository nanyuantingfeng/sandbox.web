/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
import G from 'glob'
import fs from 'fs'
import path from 'path'
import mock from 'xhr-mock'

export {mock}

export const CDN = `//XXXX.YYY.zzz/A/B/C`

export function makeMockDir(dir: string, cdn: string = CDN) {
  const CWD = path.resolve(__dirname, dir)
  const files = G.sync('**', {nodir: true, cwd: CWD})
  files.forEach((fileName: string) => {
    mock.get(`${cdn}/${fileName}`, (req, res) => {
      const content = fs.readFileSync(path.resolve(CWD, fileName))
      return res.status(200).body(String(content))
    })
  })
}

export function readFile(dir: string, fileName: string) {
  const file = path.resolve(__dirname, dir, fileName)
  const buffer = fs.readFileSync(file)
  return String(buffer)
}

export function makeURLError(url: string, message?: string) {
  mock.get(url, () => Promise.reject(new Error(message)))
}
