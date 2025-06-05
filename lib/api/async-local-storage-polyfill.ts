// Polyfill for AsyncLocalStorage when not available
export class AsyncLocalStorage<T> {
  private store: T | undefined;

  run<R>(store: T, fn: () => R): R {
    const previousStore = this.store;
    this.store = store;
    try {
      return fn();
    } finally {
      this.store = previousStore;
    }
  }

  getStore(): T | undefined {
    return this.store;
  }
}
