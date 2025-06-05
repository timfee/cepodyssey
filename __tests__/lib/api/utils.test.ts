import { withRetry, handleApiResponse, APIError } from '@/lib/api/utils'

function makeResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('api utils', () => {
  it('withRetry retries until success', async () => {
    let attempts = 0
    const result = await withRetry(async () => {
      attempts++
      if (attempts < 2) throw new Error('fail')
      return 'done'
    }, 3)
    expect(result).toBe('done')
    expect(attempts).toBe(2)
  })

  it('withRetry throws APIError directly', async () => {
    const err = new APIError('bad', 400)
    await expect(
      withRetry(() => Promise.reject(err), 2),
    ).rejects.toBe(err)
  })

  it('handleApiResponse parses body and throws errors', async () => {
    const ok = await handleApiResponse<{ x: number }>(makeResponse({ x: 1 }))
    expect(ok.x).toBe(1)

    await expect(
      handleApiResponse(makeResponse({ error: { message: 'err', code: 'E' } }, 400)),
    ).rejects.toEqual(expect.any(APIError))
  })
})
  it('handleApiResponse handles 204', async () => {
    const res = new Response(null, { status: 204 })
    const data = await handleApiResponse<object>(res)
    expect(data).toEqual({})
  })

  it('handleApiResponse handles invalid json body', async () => {
    const bad = new Response('not json', { status: 400 })
    await expect(handleApiResponse(bad)).rejects.toEqual(expect.any(APIError))
  })
