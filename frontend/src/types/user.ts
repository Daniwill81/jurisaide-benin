export enum RoleEnum {
    ADMIN = 'ADMIN',
    PUSER = 'PUSER',
}

export enum SexEnum {
    M = 'M',
    F = 'F',
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    sex?: SexEnum;
    role: RoleEnum;
    is_active: boolean;
    created?: string;
}

export interface AuthResponse {
    id: string;
    auth_key: string;
    user: User;
}
