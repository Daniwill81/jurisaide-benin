import { apiFetch } from './api';
import { AuthResponse, User } from '../types/user';

export async function login(email: string, password: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/user_token/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function register(userData: Partial<User> & { password: string }): Promise<User> {
    // We use POST /users/ which we just added to the backend
    return apiFetch<User>('/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function getCurrentUser(): Promise<User> {
    return apiFetch<User>('/users/current/');
}

export async function logoutApi(authKey: string): Promise<void> {
    return apiFetch<void>(`/auth/user_token/${authKey}/`, {
        method: 'DELETE',
    });
}
