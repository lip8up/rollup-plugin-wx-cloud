import { cloudName, tryParseJson, loadJsonFile } from '@/util'

test('cloudName', () => {
  expect(cloudName('', 'name')).toEqual('name')
  expect(cloudName('cloud', 'name')).toEqual('cloudName')
})

test('tryParseJson', () => {
  expect(tryParseJson('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 })
  expect(tryParseJson('{"a": 1, "b":}', { a: 666 })).toEqual({ a: 666 })
})

test('loadJsonFile', async () => {
  const pkg = await loadJsonFile<{ name: string }>('package.json')
  expect(pkg?.name).toEqual('rollup-plugin-wx-cloud')
  const lib = await loadJsonFile('README.md', { name: 666 })
  expect(lib?.name).toEqual(666)
  const fileNotExists = await loadJsonFile('xxxREADME.mdxxx', { name: 888 })
  expect(fileNotExists?.name).toEqual(888)
})
