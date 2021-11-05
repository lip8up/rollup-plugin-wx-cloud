import type { Plugin } from 'rollup'
import TransformerFactory, { TransformerOptions } from 'typescript-transform-wx-cloud'
import { join } from 'path'
import { dontEditText, PackageOptions } from './template'
import { cloudName } from './util'
import FunctionStore, { functionName } from './FunctionStore'
import Bundle from './Bundle'
import type { Dictionary } from './types'
import metaFile from './metaFile'

/**
 * 触发器配置。
 *
 * https://cloud.tencent.com/document/product/1209/42674
 */
export interface CloudFunctionTrigger {
  /** 触发器名称 */
  name: string

  /** 触发器类型，可选值：timer */
  type: string

  /** 触发器配置，在定时触发器下，config 格式为 cron 表达式 */
  config: string
}

/**
 * VPC 配置。
 */
export interface VPC {
  /** VPC ID */
  vpcId: string

  /** VPC 子网 ID */
  subnetId: string
}

/**
 * 微信云函数部署配置。
 *
 * https://cloud.tencent.com/document/product/1209/42674
 */
export interface WxCloudDeploy {
  /** CLI 调用云函数时的函数入参 */
  params: Dictionary

  /** 触发器配置 */
  triggers: CloudFunctionTrigger[]

  /** 函数处理方法名称，名称格式支持「文件名称.函数名称」形式，默认 'index.main' */
  handler: string

  /** 部署/更新云函数代码时的忽略文件，支持 glob 匹配规则 */
  ignore: string | string[]

  /** 超时秒数，1 ~ 60 秒，默认 6 秒 */
  timeout: number

  /** 包含环境变量的键值对对象 */
  envVariables: Dictionary

  /** 私有网络配置 */
  vpc: VPC

  /** 运行时，默认 Nodejs12.16，可选 Nodejs8.9 等 */
  runtime: string

  /** 自动安装依赖，默认 true */
  installDependency: boolean
}

/**
 * 微信云函数选项。
 */
export interface WxCloudOptions {
  /** 函数名前缀 */
  prefix?: string

  /** 生成 package.json 的配置 */
  packageOptions?: PackageOptions

  /** 全部依赖 */
  allDependencies: Dictionary<string>

  /** 原函数客户端文件生成路径，若不传，则不生成 */
  clientFilePath?: string

  /** cloudbaserc.json 文件路径，若不传，则不生成 functions 配置，选项 defaultDeploy 与 functionDeploy 也没有了意义。*/
  configFilePath?: string

  /** 默认部署配置 */
  defaultDeploy?: Partial<WxCloudDeploy>

  /** 函数配置，覆盖默认配置 */
  functionDeploy?: Dictionary<Partial<WxCloudDeploy>>

  /** 传递给 TypeScript 转换器的选项，一般不用传递该值 */
  transformerOptions?: Omit<TransformerOptions, 'wxCloudEmitParams'>
}

export function createTransformerAndPlugin(options?: WxCloudOptions) {
  const {
    prefix = '',
    packageOptions = {},
    allDependencies = {},
    transformerOptions
  } = { ...options }

  const functionStore = new FunctionStore()
  const bundle = new Bundle(prefix, functionStore, allDependencies)
  const createMetaOnce = metaFile(functionStore, options)

  const factory = new TransformerFactory({ ...transformerOptions })
  factory.on('entry', ({ filePath, params, isMain }) => {
    // watch 模式下，有可能重复添加
    /* istanbul ignore next */
    functionStore.addOrUpdate(filePath, params, isMain)
  })

  const wxCloudPlugin: Plugin = {
    name: 'wx-cloud',
    /* istanbul ignore next */
    outputOptions(options) {
      if (options.intro == null) {
        options.intro = dontEditText
      }
      return null
    },
    /* istanbul ignore next */
    async generateBundle(_, outputBundle) {
      const source = bundle.generatePackage(outputBundle, packageOptions)
      source && this.emitFile({ type: 'asset', fileName: 'package.json', source })
      await createMetaOnce()
    }
  }

  const outputDirectory = (baseDir: string, fpath: string) => {
    const name = functionName(fpath)
    return join(baseDir, cloudName(prefix, name))
  }

  return { wxCloudTransformer: factory.transformer, wxCloudPlugin, outputDirectory }
}
