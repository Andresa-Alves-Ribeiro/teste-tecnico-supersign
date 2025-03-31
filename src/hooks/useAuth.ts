import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { TOAST_CONFIG, TOAST_MESSAGES } from '@/constants/toast';

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData extends LoginData {
    name: string;
    confirmPassword: string;
}

interface ApiError {
    message: string;
    error?: string;
}

export const useAuth = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const login = async (data: LoginData) => {
        try {
            setIsLoading(true);
            const result = await signIn("credentials", {
                redirect: false,
                ...data,
            });

            if (result?.error) {
                console.error('Login error:', result.error);
                toast.error(TOAST_MESSAGES.auth.loginError, TOAST_CONFIG);
                return;
            }

            toast.success(TOAST_MESSAGES.auth.loginSuccess, TOAST_CONFIG);
            router.push("/");
        } catch (err) {
            console.error('Login error:', err);
            toast.error(TOAST_MESSAGES.auth.loginError, TOAST_CONFIG);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            setIsLoading(true);
            const apiUrl = `${window.location.origin}/api/register`;
            console.log('Registration URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            console.log('Response status:', response.status);
            
            // Handle specific HTTP status codes
            if (response.status === 405) {
                throw new Error('Registration endpoint not available. Please try again later.');
            }

            // Try to read the response body only once
            const responseText = await response.text();
            console.log('Response text:', responseText);

            let errorData: ApiError;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response:', e);
                throw new Error(`Server response error: ${response.status} - ${response.statusText}`);
            }

            if (!response.ok) {
                console.error('Registration error:', errorData);
                throw new Error(errorData.message || TOAST_MESSAGES.auth.registerError);
            }

            console.log('Registration successful, attempting to sign in...');
            const signInResult = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if (signInResult?.error) {
                console.error('Post-registration sign in error:', signInResult.error);
                throw new Error(TOAST_MESSAGES.auth.registerError);
            }

            toast.success(TOAST_MESSAGES.auth.registerSuccess, TOAST_CONFIG);
            router.push("/documents");
        } catch (err) {
            console.error('Registration error:', err);
            toast.error(
                err instanceof Error ? err.message : TOAST_MESSAGES.auth.registerError,
                TOAST_CONFIG
            );
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await signOut({
                redirect: false,
                callbackUrl: "/login",
            });
            toast.success(TOAST_MESSAGES.auth.logoutSuccess, TOAST_CONFIG);
            router.push("/login");
        } catch (err) {
            console.error('Logout error:', err);
            toast.error(TOAST_MESSAGES.auth.logoutError, TOAST_CONFIG);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login,
        register,
        logout,
        isLoading,
    };
}; 