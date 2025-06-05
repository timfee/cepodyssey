import { requestCache } from '@/lib/api/request-cache'

beforeEach(() => {
  // @ts-expect-error accessing private members for tests
  requestCache['pending'].clear();
  // @ts-expect-error accessing private members for tests
  requestCache['cache'].clear();
})

test('deduplicates concurrent requests and caches result', async () => {
  let count = 0;
  const fetcher = jest.fn().mockImplementation(async () => {
    count++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return `data${count}`;
  });

  const p1 = requestCache.request('key', fetcher, 50);
  const p2 = requestCache.request('key', fetcher, 50);
  const res1 = await p1;
  const res2 = await p2;

  expect(res1).toBe('data1');
  expect(res2).toBe('data1');
  expect(fetcher).toHaveBeenCalledTimes(1);

  const res3 = await requestCache.request('key', fetcher, 50);
  expect(res3).toBe('data1');
  expect(fetcher).toHaveBeenCalledTimes(1);
});
