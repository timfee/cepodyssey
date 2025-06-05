class RequestCache {
  private pending = new Map<string, Promise<unknown>>();
  private cache = new Map<string, { data: unknown; expires: number }>();

  async request<T>(key: string, fetcher: () => Promise<T>, ttl = 5000): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expires > now) {
      return (cached.data instanceof Response ? cached.data.clone() : cached.data) as T;
    }

    const pending = this.pending.get(key);
    if (pending) {
      return pending.then((data) => (data instanceof Response ? data.clone() : data)) as Promise<T>;
    }

    const promise: Promise<T> = fetcher()
      .then((data) => {
        this.cache.set(key, { data, expires: now + ttl });
        this.pending.delete(key);
        return data;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise.then((data) => (data instanceof Response ? data.clone() : data)) as Promise<T>;
  }
}

export const requestCache = new RequestCache();
export default RequestCache;
