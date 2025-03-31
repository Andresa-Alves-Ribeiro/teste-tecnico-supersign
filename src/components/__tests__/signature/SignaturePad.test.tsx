import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignaturePad from '../../signature/SignaturePad'
import toast from 'react-hot-toast'
import { TOAST_CONFIG } from '../../../constants/toast'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
  }
})

interface SignaturePadProps {
  onBegin?: () => void;
  onEnd?: () => void;
}

// Mock react-signature-canvas
jest.mock('react-signature-canvas', () => {
  const MockSignaturePad = React.forwardRef<{
    clear: () => void;
    isEmpty: () => boolean;
    toDataURL: () => string;
  }, SignaturePadProps>((props, ref) => {
    const [hasDrawn, setHasDrawn] = React.useState(false)

    React.useImperativeHandle(ref, () => ({
      clear: () => {
        setHasDrawn(false)
      },
      isEmpty: () => !hasDrawn,
      toDataURL: () => 'data:image/png;base64,test',
    }))

    return (
      <canvas
        data-testid="mock-signature-pad"
        aria-label="Signature pad"
        onMouseDown={() => {
          setHasDrawn(true)
          props.onBegin?.()
        }}
        onMouseUp={props.onEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setHasDrawn(true)
            props.onBegin?.()
          }
        }}
      />
    )
  })
  MockSignaturePad.displayName = 'SignatureCanvas'
  return MockSignaturePad
})

describe('SignaturePad Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<SignaturePad onSave={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByTestId('mock-signature-pad')).toBeInTheDocument()
    expect(screen.getByText('Limpar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Salvar')).toBeInTheDocument()
  })

  it('handles save button click', async () => {
    const onSave = jest.fn()
    render(<SignaturePad onSave={onSave} onCancel={jest.fn()} />)

    const saveButton = screen.getByText('Salvar')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Por favor, desenhe uma assinatura antes de salvar', TOAST_CONFIG)
    })
  })

  it('handles cancel button click', () => {
    const onCancel = jest.fn()
    render(<SignaturePad onSave={jest.fn()} onCancel={onCancel} />)

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })

  it('handles save with valid signature', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    render(<SignaturePad onSave={onSave} onCancel={jest.fn()} />)

    const signaturePad = screen.getByTestId('mock-signature-pad')
    fireEvent.mouseDown(signaturePad)
    fireEvent.mouseUp(signaturePad)

    const saveButton = screen.getByText('Salvar')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('data:image/png;base64,test')
      expect(toast.success).toHaveBeenCalledWith('Assinatura salva com sucesso!', TOAST_CONFIG)
    })
  })

  it('handles save error', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Failed to save'))
    render(<SignaturePad onSave={onSave} onCancel={jest.fn()} />)

    const signaturePad = screen.getByTestId('mock-signature-pad')
    fireEvent.mouseDown(signaturePad)
    fireEvent.mouseUp(signaturePad)

    const saveButton = screen.getByText('Salvar')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar assinatura', TOAST_CONFIG)
    })
  })

  it('disables save button while saving', async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    const onSave = jest.fn().mockImplementation(() => delay(100))
    render(<SignaturePad onSave={onSave} onCancel={jest.fn()} />)

    const signaturePad = screen.getByTestId('mock-signature-pad')
    fireEvent.mouseDown(signaturePad)
    fireEvent.mouseUp(signaturePad)

    const saveButton = screen.getByText('Salvar')
    fireEvent.click(saveButton)

    expect(saveButton).toBeDisabled()

    jest.advanceTimersByTime(100)

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
  })
}) 