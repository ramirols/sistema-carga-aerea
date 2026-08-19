import { RolUsuario } from './auth.model';

export interface Usuario {
    id: number;
    username: string;
    nombreCompleto: string;
    rol: RolUsuario;
    activo: boolean;
    fechaCreacion: string;
    fechaActualizacion: string;
}

export interface UsuarioRequest {
    username: string;
    password: string;
    nombreCompleto: string;
    rol: RolUsuario;
}

export interface UsuarioUpdate {
    nombreCompleto: string;
    rol: RolUsuario;
    password?: string;
}