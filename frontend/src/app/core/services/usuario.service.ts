import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../models/page.model';
import {
    Usuario,
    UsuarioRequest,
    UsuarioUpdate
} from '../models/usuario.model';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/usuarios';

    listar(
        page = 0,
        size = 10,
        busqueda?: string,
        activo?: boolean
    ): Observable<PageResponse<Usuario>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (busqueda) {
            params = params.set('busqueda', busqueda);
        }

        if (activo !== undefined) {
            params = params.set('activo', activo);
        }

        return this.http.get<PageResponse<Usuario>>(this.apiUrl, { params });
    }

    obtener(id: number): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
    }

    crear(datos: UsuarioRequest): Observable<Usuario> {
        return this.http.post<Usuario>(this.apiUrl, datos);
    }

    actualizar(id: number, datos: UsuarioUpdate): Observable<Usuario> {
        return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datos);
    }

    cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
        return this.http.patch<Usuario>(`${this.apiUrl}/${id}/estado`, {
            activo
        });
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}