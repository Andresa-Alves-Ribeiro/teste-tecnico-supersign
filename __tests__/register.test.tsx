import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import RegisterPage from '../src/pages/register';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test-utils';

// Mock do next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock do hook de autenticação
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock do next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    const { ...restProps } = props;
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('RegisterPage', () => {
  const mockRegister = jest.fn();
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false
    });
  });

  it('renders all form fields', () => {
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByPlaceholderText('Seu nome completo');
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByLabelText('Senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Senha');
    
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByPlaceholderText('Seu nome completo');
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByLabelText('Senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Senha');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }));
    });
  });

  it('shows error when passwords do not match', async () => {
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByPlaceholderText('Seu nome completo');
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByLabelText('Senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Senha');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
      const errorMessage = screen.getByText('As senhas não coincidem');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking login link', () => {
    renderWithProviders(<RegisterPage />);

    const loginLink = screen.getByRole('link', { name: /faça login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
}); 