import { debounce } from 'lodash'
import { writeFile } from 'fs/promises'
import extend from 'deep-extend'
import { clientTemplate } from './template'
import type { WxCloudOptions } from './plugin'
import type { Dictionary } from './types'
import type FunctionManager from './FunctionStore'
import { loadJsonFile } from './util'

const libDefaultDeploy = {
  timeout: 6,
  runtime: 'Nodejs12.16',
  installDependency: true
}

export type MetaFileOptions = Pick<WxCloudOptions, 'prefix' | 'clientFilePath' | 'configFilePath' | 'defaultDeploy' | 'functionDeploy'>

export default function(functionStore: FunctionManager, options?: MetaFileOptions) {
  const {
    prefix = '',
    clientFilePath,
    configFilePath,
    defaultDeploy = {},
    functionDeploy = {}
  } = { ...options }

  const createClientFile = async () => {
    if (clientFilePath) {
      const source = clientTemplate(prefix, functionStore.list)
      await writeFile(clientFilePath, source)
    }
  }

  const updateFunctionConfig = async () => {
    if (configFilePath) {
      const config = await loadJsonFile<Dictionary>(configFilePath, {})
      const functions = functionStore.list.map(({ name }) =>
        extend({ name }, libDefaultDeploy, defaultDeploy, functionDeploy[name])
      )
      config.functions = functions
      const json = JSON.stringify(config, null, 2)
      await writeFile(configFilePath, json)
    }
  }

  const createFile = async () => {
    await Promise.all([ createClientFile(), updateFunctionConfig() ])
  }

  return debounce(createFile, 666, { leading: true, trailing: false })
}
