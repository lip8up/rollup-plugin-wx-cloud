import { parse, basename, dirname } from 'path'
import { constants } from 'fs'
import { access, readFile } from 'fs/promises'
import { upperFirst } from 'lodash'
import type { Dictionary } from './types'

/**
 * 根据路径，获取函数名。
 *
 * @param fpath 路径
 */
export function functionName(fpath: string) {
  const { name, dir } = parse(fpath)
  return name == 'index' ? basename(dir) : name
}

/**
 * 获取云函数名。
 *
 * @param prefix 前缀
 * @param name 名称
 */
export function cloudName(prefix: string, name: string) {
  return prefix ? prefix + upperFirst(name) : name
}

/**
 * 是否能写文件路径所在的文件夹。
 *
 * @param fpath 文件路径
 */
export async function accessDir(fpath: string) {
  const dir = dirname(fpath)
  await access(dir, constants.W_OK)
}

/**
 * 解析 json，不抛出异常，若发生异常，返回 defaultValue。
 *
 * @param json json 字符串
 * @param defaultValue 发生错误时，返回的默认值，默认 undefined
 */
export function tryParseJson<T = Dictionary>(json: string): T | undefined
export function tryParseJson<T = Dictionary>(json: string, defaultValue: T): T
export function tryParseJson<T = Dictionary>(json: string, defaultValue?: T) {
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

/**
 * 从 json 文件中解析 JSON 串。
 *
 * @param fpath 文件路径
 * @param defaultValue 发生错误时，返回的默认值，默认 undefined
 */
export async function loadJsonFile<T = Dictionary>(fpath: string): Promise<T | undefined>
export async function loadJsonFile<T = Dictionary>(fpath: string, defaultValue: T): Promise<T>
export async function loadJsonFile<T = Dictionary>(fpath: string, defaultValue?: T) {
  const text = await readFile(fpath, 'utf8')
  return tryParseJson<T>(text, defaultValue!)
}
