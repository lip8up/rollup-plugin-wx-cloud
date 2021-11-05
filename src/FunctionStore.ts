import { parse, basename } from 'path'

/**
 * 函数配置
 */
export interface Function {
  /** 函数名 */
  name: string

  /** 函数参数列表 */
  params: string[]

  /** 是否为 main 函数 */
  isMain: boolean
}

/**
 * 根据路径，获取函数名。
 *
 * @param fpath 路径
 */
export function functionName(fpath: string) {
  const { name, dir } = parse(fpath)
  return name == 'index' ? basename(dir) : name
}

export default class FunctionStore {
  constructor(readonly list: Function[] = []) {
  }

  /**
   * 使用文件路径，从函数列表中，查找相应的函数项。
   *
   * @param fpath 文件路径
   */
  get(fpath: string | undefined) {
    const funcName = functionName(fpath || '')
    return this.list.find(({ name }) => name == funcName)
  }

  /**
   * 添加或更新函数项。
   *
   * @param fpath 文件路径
   * @param params 参数名称列表
   * @param isMain 是否为 main 函数
   */
  addOrUpdate(fpath: string, params: string[], isMain: boolean) {
    const name = functionName(fpath)
    const newItem = { name, params, isMain }
    const index = this.list.findIndex(({ name }) => name == newItem.name)
    this.list.splice(index >= 0 ? index : this.list.length, 1, newItem)
    return this
  }
}
