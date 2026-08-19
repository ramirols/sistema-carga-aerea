export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    tipo: string;
    usuarioId: number;
    username: string;
    nombreCompleto: string;
    rol: RolUsuario;
    expiraEnSegundos: number;
}

export interface SesionUsuario {
    usuarioId: number;
    username: string;
    nombreCompleto: string;
    rol: RolUsuario;
}

export type RolUsuario =
    | 'ADMINISTRADOR'
    | 'OPERADOR';