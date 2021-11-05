import FunctionStore, { functionName } from '@/FunctionStore'

test('functionName', () => {
  expect(functionName('some/path/name.ts')).toEqual('name')
  expect(functionName('some/path/name/index.ts')).toEqual('name')
  expect(functionName('')).toEqual('')
})

const fns = [
  { name: 'foo', params: [], isMain: false },
  { name: 'bar', params: ['object'], isMain: false },
  { name: 'haha', params: ['a', 'b'], isMain: true },
]

test('get', () => {
  const store = new FunctionStore(fns.slice())

  expect(store.get('some/path/foo.ts')).toEqual(fns[0])
  expect(store.get('some/path/foo/index.ts')).toEqual(fns[0])
  expect(store.get('some/path/bar.ts')).toEqual(fns[1])
  expect(store.get('some/path/bar/index.ts')).toEqual(fns[1])
  expect(store.get('some/path/haha.ts')).toEqual(fns[2])
  expect(store.get('some/path/haha/index.ts')).toEqual(fns[2])
  expect(store.get(undefined)).toEqual(undefined)
})

const list = [
  { fpath: 'some/path/foo.ts', params: ['x', 'y'], isMain: true, add: false },
  { fpath: 'some/path/xxx/index.ts', params: ['w'], isMain: false, add: true },
]

test('addOrUpdate', () => {
  for (const item of list) {
    const store = new FunctionStore(fns.slice())

    const newItem = { name: functionName(item.fpath), params: item.params, isMain: item.isMain }
    const result = item.add ? [ ...fns, newItem ] : [ newItem, ...fns.slice(1) ]

    expect(store.addOrUpdate(item.fpath, item.params, item.isMain).list).toEqual(result)
  }
})
