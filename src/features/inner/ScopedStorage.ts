/***************************************************
 * Created by nanyuantingfeng on 2021/10/4 22:04. *
 ***************************************************/
export class ScopedStorage implements Storage {
  constructor(public scope: string, public realStorage: Storage) {
    try {
      this.dataset = JSON.parse(realStorage.getItem(scope) || '{}')
    } catch (e) {
      this.dataset = {}
    }
  }

  private dataset: Record<string, string> = {}

  private syncToHost(): void {
    this.realStorage.setItem(this.scope, JSON.stringify(this.dataset))
  }

  getItem(key: string): string {
    return this.dataset[key]
  }

  setItem(key: string, value: string): void {
    this.dataset[key] = value
    this.syncToHost()
  }

  removeItem(key: string): void {
    this.dataset[key] = undefined
    delete this.dataset[key]
    this.syncToHost()
  }

  clear(): void {
    this.dataset = {}
    this.syncToHost()
  }

  key(i: number): string {
    const keys = Object.keys(this.dataset)
    return keys[i]
  }

  get length(): number {
    return Object.keys(this.dataset).length
  }
}
