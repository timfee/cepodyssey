/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowStepCard } from '@/components/workflow'
import { Provider } from 'react-redux'
import { store } from '@/lib/redux/store'
import { mockStep } from '@/test/fixtures/steps'

const renderWithProviders = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>)
}

describe('WorkflowStepCard', () => {
  it('should render step information', () => {
    renderWithProviders(
      <WorkflowStepCard
        step={mockStep}
        allOutputs={{}}
        canRunGlobal={true}
        onExecute={jest.fn()}
        stepInputDefs={[]}
        stepOutputDefs={[]}
      />,
    )

    expect(screen.getByText(mockStep.title)).toBeInTheDocument()
    expect(screen.getByText(mockStep.description)).toBeInTheDocument()
  })

  it('should call onExecute when Execute button clicked', () => {
    const mockExecute = jest.fn()
    renderWithProviders(
      <WorkflowStepCard
        step={{ ...mockStep, status: 'pending' }}
        allOutputs={{}}
        canRunGlobal={true}
        onExecute={mockExecute}
        stepInputDefs={[]}
        stepOutputDefs={[]}
      />,
    )

    const executeButton = screen.getByRole('button', { name: /execute/i })
    fireEvent.click(executeButton)

    expect(mockExecute).toHaveBeenCalledWith(mockStep.id)
  })

  it('should show blocked state when dependencies not met', () => {
    renderWithProviders(
      <WorkflowStepCard
        step={{ ...mockStep, status: 'blocked' }}
        allOutputs={{}}
        canRunGlobal={true}
        onExecute={jest.fn()}
        stepInputDefs={[]}
        stepOutputDefs={[]}
      />,
    )

    expect(screen.getByText(/Complete prerequisite steps/i)).toBeInTheDocument()
  })
})
