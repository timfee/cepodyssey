import { render, screen } from '@testing-library/react'
import { ProviderSignInBlock } from '@/components/sign-in'

test('shows button when not connected', () => {
  render(<ProviderSignInBlock providerName="Google Workspace" isConnected={false} />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})

test('shows connected state', () => {
  render(<ProviderSignInBlock providerName="Microsoft Entra ID" isConnected={true} />)
  expect(screen.getByText('Connected')).toBeInTheDocument()
})
