import type { Plugin, OutputBundle, OutputAsset, OutputChunk } from 'rollup'
import { makeTransformerFactory, TransformerOptions } from 'typescript-transform-wx-cloud'
import { join, dirname } from 'path'
import { clientTemplate, packageTemplate, dontEditText, Function, Package } from './template'
import { constants } from 'fs'
import { writeFile, access } from 'fs/promises'
import { debounce } from 'lodash'
import { functionName, cloudName as cloudNameUtil, cloudName } from './util'

export interface WxCloudOptions {
  /** 函数名前缀 */
  prefix?: string

  /** 生成 package.json 的配置 */
  packageOptions?: Partial<Omit<Package, 'name' | 'dependencies'>>

  /** 全部依赖 */
  allDependencies: { [name: string]: string }

  /** 原函数客户端文件生成路径，若不传，则不生成 */
  clientFilePath?: string

  /** 传递给 TypeScript 转换器的选项，一般不用传递该值 */
  transformerOptions?: Omit<TransformerOptions, 'wxCloudEmitParams'>
}

const isEntryChunk = (bundle: OutputAsset | OutputChunk): bundle is OutputChunk => {
  return bundle.type == 'chunk' && bundle.isEntry
}

export function createTransformerAndPlugin(options?: WxCloudOptions) {
  const {
    prefix = '',
    packageOptions = {},
    allDependencies = {},
    clientFilePath,
    transformerOptions
  } = { ...options }

  const cloudName = (name: string) => cloudNameUtil(prefix, name)

  const functionList: Function[] = []

  const getFunction = (fpath: string) => {
    const funcName = functionName(fpath)
    return functionList.find(({ name }) => name == funcName)
  }

  const wxCloudTransformer = makeTransformerFactory({
    ...transformerOptions,
    wxCloudEmitParams(fileName, params) {
      // watch 模式下，有可能重复添加
      const name = functionName(fileName)
      const newItem = { name, params }
      const index = functionList.findIndex(({ name }) => name == newItem.name)
      functionList.splice(index >= 0 ? index : functionList.length, 1, newItem)
    }
  })

  const resolveChunk = async(bundle: OutputBundle) => {
    const chunks = Object.values(bundle).filter(isEntryChunk)
    for (const chunk of chunks) {
      const fpath = chunk.facadeModuleId?.trim()
      const func = await getFunction(fpath || '')
      if (func != null) {
        return {
          name: func.name,
          imports: chunk.imports
        }
      }
    }
  }

  const resolveDependencies = (imports: string[]) => {
    return imports.filter(name => name in allDependencies)
      .map(name => ({ name, version: allDependencies[name] }))
  }

  const createClientFile = async () => {
    if (clientFilePath) {
      const fpath = dirname(clientFilePath)
      await access(fpath, constants.W_OK)
      const source = clientTemplate(prefix, functionList)
      await writeFile(clientFilePath, source)
    }
  }

  const createClientFileOnce = debounce(createClientFile, 666, { leading: true, trailing: false })

  const wxCloudPlugin: Plugin = {
    name: 'wx-cloud',
    outputOptions(options) {
      if (options.intro == null) {
        options.intro = dontEditText
      }
      return null
    },
    async generateBundle(_, bundle) {
      const item = await resolveChunk(bundle)
      if (item != null) {
        const { name, imports } = item
        const dependencies = resolveDependencies(imports)
        const source = packageTemplate({
          ...packageOptions,
          name: cloudName(name),
          dependencies
        })
        this.emitFile({ type: 'asset', fileName: 'package.json', source })
      }

      await createClientFileOnce()
    }
  }

  const outputDirectory = (baseDir: string, fpath: string) => {
    const name = functionName(fpath)
    return join(baseDir, cloudName(name))
  }

  return { wxCloudTransformer, wxCloudPlugin, outputDirectory }
}
