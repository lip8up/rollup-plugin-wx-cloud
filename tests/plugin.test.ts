import { createTransformerAndPlugin } from '@/plugin'

test('createTransformerAndPlugin', () => {
  const { wxCloudTransformer, wxCloudPlugin, outputDirectory } = createTransformerAndPlugin()
  expect(wxCloudTransformer).toBeFunction()
  expect(wxCloudPlugin).toBeObject()

  expect(outputDirectory('some/dir', 'some/path/name.ts')).toEqual('some/dir/name')
  expect(outputDirectory('some/dir', 'some/path/name/index.ts')).toEqual('some/dir/name')
})
