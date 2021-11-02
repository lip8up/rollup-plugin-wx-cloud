import { source } from 'common-tags'
import { paramsLiteral, objectLiteral, clientTemplate } from '@/template'

test('paramsLiteral', () => {
  expect(paramsLiteral([])).toEqual('()')
  expect(paramsLiteral(['a'])).toEqual('a')
  expect(paramsLiteral(['a'], true)).toEqual('(a)')
  expect(paramsLiteral(['a', 'b'])).toEqual('(a, b)')
})

test('objectLiteral', () => {
  expect(objectLiteral([])).toEqual('{}')
  expect(objectLiteral(['a'])).toEqual('{ a }')
  expect(objectLiteral(['a', 'b'])).toEqual('{ a, b }')
})

test('clientTemplate', () => {
  expect(
    clientTemplate(
      'airead',
      [
        { name: 'getOpenId', params: [], isMain: false },
        { name: 'format', params: ['object'], isMain: false },
        { name: 'sum', params: ['a', 'b'], isMain: false },
        { name: 'wxContext', params: ['data'], isMain: true },
      ]
    )
  )
  .toEqual(source`
    //~~** This file is auto generated by tools, please DO NOT EDIT it. **~~
    import type functionGetOpenId from '@cloud/functions/getOpenId'
    import type functionFormat from '@cloud/functions/format'
    import type functionSum from '@cloud/functions/sum'
    import type { main as functionWxContext } from '@cloud/functions/wxContext'

    type PromiseType<T> = T extends Promise<infer _> ? T : Promise<T>

    type PromiseReturnType<T extends (...args: any) => any> = (...args: Parameters<T>) => PromiseType<ReturnType<T>>

    export const cloudGetOpenId: PromiseReturnType<typeof functionGetOpenId> = () => {
      return wx.cloud.callFunction({ name: 'aireadGetOpenId', data: {} }).then(res => res.result as any)
    }

    export const cloudFormat: PromiseReturnType<typeof functionFormat> = object => {
      return wx.cloud.callFunction({ name: 'aireadFormat', data: { object } }).then(res => res.result as any)
    }

    export const cloudSum: PromiseReturnType<typeof functionSum> = (a, b) => {
      return wx.cloud.callFunction({ name: 'aireadSum', data: { a, b } }).then(res => res.result as any)
    }

    export const cloudWxContext = (data?: any): PromiseType<ReturnType<typeof functionWxContext>> => {
      return wx.cloud.callFunction({ name: 'aireadWxContext', data }).then(res => res.result as any)
    }

    export default {
      getOpenId: cloudGetOpenId,
      format: cloudFormat,
      sum: cloudSum,
      wxContext: cloudWxContext
    }
  `.trim())
})
