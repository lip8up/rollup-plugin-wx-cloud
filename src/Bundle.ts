import type { OutputBundle, OutputAsset, OutputChunk } from 'rollup'
import type FunctionStore from './FunctionStore'
import type { Dictionary } from './types'
import { packageTemplate, PackageOptions } from './template'
import { cloudName } from './util'

const isEntryChunk = (bundle: OutputAsset | OutputChunk): bundle is OutputChunk => {
  return bundle.type == 'chunk' && bundle.isEntry
}

export default class Bundle {
  constructor(
    private prefix: string,
    private functionStore: FunctionStore,
    private allDependencies: Dictionary<string>
  ) {
  }

  generatePackage(bundle: OutputBundle, packageOptions: PackageOptions) {
    const item = this.resolveChunk(bundle)
    if (item != null) {
      const { name, imports } = item
      const dependencies = this.resolveDependencies(imports)
      const source = packageTemplate({
        ...packageOptions,
        name: cloudName(this.prefix, name),
        dependencies
      })
      return source
    }
  }

  private resolveChunk(bundle: OutputBundle) {
    const chunks = Object.values(bundle).filter(isEntryChunk)
    for (const chunk of chunks) {
      const fpath = chunk.facadeModuleId?.trim()
      const func = this.functionStore.get(fpath)
      if (func != null) {
        return {
          name: func.name,
          imports: chunk.imports
        }
      }
    }
  }

  private resolveDependencies(imports: string[]) {
    return imports.filter(name => name in this.allDependencies)
      .map(name => ({ name, version: this.allDependencies[name] }))
  }
}
