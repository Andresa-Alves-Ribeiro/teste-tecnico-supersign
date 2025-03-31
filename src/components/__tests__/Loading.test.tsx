import { render, screen } from '@testing-library/react'
import Loading from '../Loading'

describe('Loading Component', () => {
  it('renders with default text', () => {
    render(<Loading />)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    const customText = 'Aguarde um momento...'
    render(<Loading text={customText} />)
    expect(screen.getByText(customText)).toBeInTheDocument()
  })

  it('renders loading animation elements', () => {
    render(<Loading />)

    // Check for the loading text
    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    // Check for the loading animation container
    const animationContainer = screen.getByTestId('loading-animation')
    expect(animationContainer).toBeInTheDocument()
    expect(animationContainer).toHaveClass('animate-spin')
  })
}) 