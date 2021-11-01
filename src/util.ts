import { parse, basename } from 'path'
import { upperFirst } from 'lodash'

export function functionName(fpath: string) {
  const { name, dir } = parse(fpath)
  return name == 'index' ? basename(dir) : name
}

export function cloudName(prefix: string, name: string) {
  return prefix ? prefix + upperFirst(name) : name
}
