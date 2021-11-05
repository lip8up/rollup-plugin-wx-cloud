import type { OutputBundle, OutputChunk } from 'rollup'
import Bundle from '@/Bundle'
import FunctionStore from '@/FunctionStore'
import type { PackageOptions } from '@/template'
import { Dictionary } from '@/types'

const allDeps: Dictionary<string> = {
  cheerio: '^1.0.0-rc.10',
  got: '^11.8.2',
  'iconv-lite': '^0.6.3',
  'wx-server-sdk': '^2.5.3',
  'comment-json': '^4.1.1',
  esbuild: '^0.13.4',
  eslint: '^7.32.0',
}

const packageOptions: PackageOptions = {
  version: '6.6.6',
  description: 'some package',
  author: 'lip8up'
}

const otherFields = {
  name: '',
  code: '',
  dynamicImports: [],
  fileName: '',
  implicitlyLoadedBefore: [],
  importedBindings: {},
  referencedFiles: [],
  exports: [],
  isDynamicEntry: false,
  isImplicitEntry: false,
  modules: {}
}

const makeBundle = (name: string) => {
  const input: OutputBundle = {
    foo: {
      ...otherFields,
      isEntry: name === 'foo',
      type: 'chunk',
      imports: ['cheerio', 'got'],
      facadeModuleId: 'some/path/foo.ts',
    },
    bar: {
      ...otherFields,
      type: 'chunk',
      isEntry: name === 'bar',
      imports: ['cheerio', 'iconv-lite', 'wx-server-sdk'],
      facadeModuleId: 'some/path/bar/index.ts',
    },
    haha: {
      ...otherFields,
      type: 'chunk',
      isEntry: name === 'haha',
      imports: ['wx-server-sdk', 'comment-json', 'util'],
      facadeModuleId: 'some/path/haha/index.ts',
    }
  }

  if (!(name in input)) {
    return { input, output: undefined }
  }

  const output = {
    name,
    version: packageOptions.version || '',
    description: packageOptions.description || '',
    author: packageOptions.author || '',
    license: packageOptions.license || 'MIT',
    dependencies: (input[name] as OutputChunk).imports
      .reduce((ret, name) => ({ ...ret, [name]: allDeps[name] }), {})
  }

  return { input, output: JSON.stringify(output, null, 2) }
}

test('generatePackage', () => {
  const fns = [
    { name: 'foo', params: [], isMain: false },
    { name: 'bar', params: ['object'], isMain: false },
    { name: 'haha', params: ['a', 'b'], isMain: true },
    { name: '000000', params: ['a', 'b'], isMain: true },
  ]
  const store = new FunctionStore(fns)

  const bundle = new Bundle('', store, allDeps)

  for (const fn of fns) {
    const { input, output } = makeBundle(fn.name)
    const source = bundle.generatePackage(input, packageOptions)
    expect(source?.trim()).toEqual(output?.trim())
  }
})
