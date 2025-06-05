import { SecureStorage } from '@/lib/storage'

describe('SecureStorage', () => {
  it('saves and loads data using localStorage', async () => {
    const storage = new SecureStorage()
    await storage.save('k', { a: 1 })
    const loaded = storage.load<{ a: number }>('k')
    expect(loaded).toEqual({ a: 1 })
  })

  it('falls back to sessionStorage on localStorage failure', async () => {
    const storage = new SecureStorage()
    const origSet = Storage.prototype.setItem
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const spy = jest.spyOn(window.sessionStorage, 'setItem')
    await storage.save('x', { b: 2 })
    expect(spy).toHaveBeenCalled()
    ;(Storage.prototype.setItem as jest.Mock).mockImplementation(origSet)
  })
})
