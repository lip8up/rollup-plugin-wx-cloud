import { source } from 'common-tags'
import { upperFirst, kebabCase } from 'lodash'
import { cloudName } from './util'
import type { Function } from './FunctionStore'

/**
 * 将参数列表，转成函数参数列表文本，例如 [a, b] => (a, b)。
 *
 * @param params 参数列表
 * @param arrowParens 对于单个参数，是否始终使用括号，默认 false，即对单个参数不使用括号。
 */
export const paramsLiteral = (params: string[], arrowParens = false) =>
  params.length == 1 && !arrowParens ? `${params[0]}` : `(${params.join(', ')})`

/**
 * 将参数列表，转成对象文本，例如 [a, b] => { a, b }。
 *
 * @param params 参数列表
 */
export const objectLiteral = (params: string[]) => params.length == 0 ? '{}' : `{ ${params.join(', ')} }`

/**
 * 不要编辑文件文本
 */
export const dontEditText = '//~~** This file is auto generated by tools, please DO NOT EDIT it. **~~'

/**
 * 客户端函数模板类型。
 */
export type ClientTemplate = (prefix: string, functions: Function[]) => string

/**
 * 默认客户端函数模板。
 *
 * @param prefix 云函数名称前缀
 * @param functions 函数列表配置
 */
export const clientTemplate: ClientTemplate = (prefix, functions) => {
  const fns = functions.map(({ name, params, isMain }) => ({
    name,
    Name: upperFirst(name),
    cloudName: cloudName(prefix, name),
    functionName: 'function' + upperFirst(name),
    paramsText: paramsLiteral(params),
    dataText: isMain ? 'data' : `data: ${objectLiteral(params)}`,
    isMain
  }))
  // prettier-ignore
  const text = source`
    ${dontEditText}
    ${fns.map(({ name, functionName, isMain }) => source`
      import type ${isMain ? `{ main as ${functionName} }` : functionName} from '@cloud/functions/${name}'
    `)}

    type PromiseType<T> = T extends Promise<infer _> ? T : Promise<T>

    type PromiseReturnType<T extends (...args: any) => any> = (...args: Parameters<T>) => PromiseType<ReturnType<T>>

    ${fns.map(({ Name, cloudName, functionName, paramsText, dataText, isMain }) => source`
      ${isMain
        ? `export const cloud${Name} = (data?: any): PromiseType<ReturnType<typeof ${functionName}>> => {`
        : `export const cloud${Name}: PromiseReturnType<typeof ${functionName}> = ${paramsText} => {`
      }
        return wx.cloud.callFunction({ name: '${cloudName}', ${dataText} }).then(res => res.result as any)
      }
    `).join('\n\n')}

    export default {
      ${fns.map(({ name, Name }) => source`
        ${name}: cloud${Name}
      `).join(',\n')}
    }
  `
  return text
}

/**
 * 生成 package.json 的配置。
 */
export interface Package {
  /** 包名 */
  name: string

  /** 版本号 */
  version: string

  /** 描述 */
  description: string

  /** 作者 */
  author: string

  /** 协议，默认为 MIT */
  license: string

  /** 依赖包列表 */
  dependencies: { name: string, version: string }[]
}

/**
 * 省略 name、dependencies 后的配置。
 */
export type PackageOptions = Partial<Omit<Package, 'name' | 'dependencies'>>

/**
 * 生成 package.json 函数模板类型。
 */
export type PackageTemplate = (pkg: Partial<Package>) => string

/**
 * 生成 package.json 的默认函数。
 * @param pkg 配置
 */
export const packageTemplate: PackageTemplate = pkg => {
  const dependencies = (pkg.dependencies || []).reduce((ret, { name, version }) => ({ ...ret, [name]: version }), {})
  const text = JSON.stringify({
    name: kebabCase(pkg.name),
    version: pkg.version || '0.0.1',
    description: pkg.description || '',
    author: pkg.author || '',
    license: pkg.license || 'MIT',
    dependencies
  }, null, 2)
  return text
}
