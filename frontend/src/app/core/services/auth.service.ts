import { HttpClient } from '@angular/common/http';
import {
    computed,
    inject,
    Injectable,
    signal,
} from '@angular/core';

import { Observable, tap } from 'rxjs';

import {
    LoginRequest,
    LoginResponse,
    SesionUsuario,
} from '../models/auth.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        'http://localhost:8080/api/auth';

    private readonly tokenKey = 'carga_aerea_token';
    private readonly usuarioKey = 'carga_aerea_usuario';

    private readonly usuarioSignal =
        signal<SesionUsuario | null>(
            this.obtenerUsuarioGuardado(),
        );

    readonly usuario = this.usuarioSignal.asReadonly();

    readonly autenticado = computed(() => {
        return (
            this.obtenerToken() !== null &&
            !this.tokenExpirado()
        );
    });

    readonly esAdministrador = computed(() => {
        return (
            this.usuarioSignal()?.rol === 'ADMINISTRADOR'
        );
    });

    login(
        datos: LoginRequest,
    ): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(
                `${this.apiUrl}/login`,
                datos,
            )
            .pipe(
                tap((respuesta) => {
                    this.guardarSesion(respuesta);
                }),
            );
    }

    cerrarSesion(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.usuarioKey);
        this.usuarioSignal.set(null);
    }

    obtenerToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    tokenExpirado(): boolean {
        const token = this.obtenerToken();

        if (!token) {
            return true;
        }

        try {
            const partes = token.split('.');

            if (partes.length !== 3) {
                return true;
            }

            const payload = JSON.parse(
                this.decodificarBase64Url(partes[1]),
            );

            const expiracion = Number(payload.exp) * 1000;

            return (
                !expiracion ||
                Number.isNaN(expiracion) ||
                Date.now() >= expiracion
            );
        } catch {
            return true;
        }
    }

    private guardarSesion(
        respuesta: LoginResponse,
    ): void {
        const usuario: SesionUsuario = {
            usuarioId: respuesta.usuarioId,
            username: respuesta.username,
            nombreCompleto: respuesta.nombreCompleto,
            rol: respuesta.rol,
        };

        localStorage.setItem(
            this.tokenKey,
            respuesta.token,
        );

        localStorage.setItem(
            this.usuarioKey,
            JSON.stringify(usuario),
        );

        this.usuarioSignal.set(usuario);
    }

    private obtenerUsuarioGuardado():
        | SesionUsuario
        | null {
        const valor = localStorage.getItem(
            this.usuarioKey,
        );

        if (!valor) {
            return null;
        }

        try {
            return JSON.parse(valor) as SesionUsuario;
        } catch {
            localStorage.removeItem(this.usuarioKey);
            return null;
        }
    }

    private decodificarBase64Url(
        valor: string,
    ): string {
        const base64 = valor
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const normalizado = base64.padEnd(
            base64.length +
            ((4 - (base64.length % 4)) % 4),
            '=',
        );

        const bytes = Uint8Array.from(
            atob(normalizado),
            (caracter) => caracter.charCodeAt(0),
        );

        return new TextDecoder().decode(bytes);
    }
}