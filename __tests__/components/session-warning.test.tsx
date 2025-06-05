/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react'
import { SessionWarning } from '@/components/session-warning'
import { act } from 'react'

jest.useFakeTimers()

describe('SessionWarning', () => {
  it('shows warning after timeout', () => {
    render(<SessionWarning />)
    expect(screen.queryByRole('alert')).toBeNull()
    act(() => {
      jest.advanceTimersByTime(20 * 60 * 1000)
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('clears timer on unmount', () => {
    const { unmount } = render(<SessionWarning />)
    unmount()
    expect(jest.getTimerCount()).toBe(0)
  })
})
