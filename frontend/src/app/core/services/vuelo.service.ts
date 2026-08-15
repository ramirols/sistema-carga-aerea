import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../models/page.model';
import {
    EstadoVuelo,
    Vuelo,
    VueloRequest
} from '../models/vuelo.model';

@Injectable({
    providedIn: 'root'
})
export class VueloService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/vuelos';

    listar(
        page = 0,
        size = 10,
        busqueda?: string,
        desde?: string,
        hasta?: string,
        estado?: EstadoVuelo
    ): Observable<PageResponse<Vuelo>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (busqueda) {
            params = params.set('busqueda', busqueda);
        }

        if (desde) {
            params = params.set('desde', desde);
        }

        if (hasta) {
            params = params.set('hasta', hasta);
        }

        if (estado) {
            params = params.set('estado', estado);
        }

        return this.http.get<PageResponse<Vuelo>>(this.apiUrl, { params });
    }

    obtener(id: number): Observable<Vuelo> {
        return this.http.get<Vuelo>(`${this.apiUrl}/${id}`);
    }

    crear(datos: VueloRequest): Observable<Vuelo> {
        return this.http.post<Vuelo>(this.apiUrl, datos);
    }

    actualizar(id: number, datos: VueloRequest): Observable<Vuelo> {
        return this.http.put<Vuelo>(`${this.apiUrl}/${id}`, datos);
    }

    cambiarEstado(id: number, estado: EstadoVuelo): Observable<Vuelo> {
        return this.http.patch<Vuelo>(`${this.apiUrl}/${id}/estado`, {
            estado
        });
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}