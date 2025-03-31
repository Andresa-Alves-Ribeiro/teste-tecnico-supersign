import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/router';
import LoginPage from '../src/pages/login';
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

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false
    });
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('shows loading state when submitting', async () => {
    const mockLoginWithDelay = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLoginWithDelay,
      isLoading: false
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    const loadingButton = await screen.findByRole('button', { name: /carregando\.\.\./i });
    expect(loadingButton).toBeDisabled();
  });

  it('navigates to register page when clicking register link', () => {
    renderWithProviders(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /registre-se/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });
}); 