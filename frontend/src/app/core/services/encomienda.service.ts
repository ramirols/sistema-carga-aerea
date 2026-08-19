import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
    Encomienda,
    EncomiendaRequest,
    EstadoAutorizacion,
    EstadoEncomienda
} from '../models/encomienda.model';
import { PageResponse } from '../models/page.model';

@Injectable({
    providedIn: 'root'
})
export class EncomiendaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/encomiendas';

    listar(
        page = 0,
        size = 10,
        busqueda?: string,
        desde?: string,
        hasta?: string,
        estado?: EstadoEncomienda
    ): Observable<PageResponse<Encomienda>> {
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

        return this.http.get<PageResponse<Encomienda>>(this.apiUrl, {
            params
        });
    }

    obtener(id: number): Observable<Encomienda> {
        return this.http.get<Encomienda>(`${this.apiUrl}/${id}`);
    }

    porVuelo(vueloId: number): Observable<Encomienda[]> {
        return this.http.get<Encomienda[]>(
            `${this.apiUrl}/por-vuelo/${vueloId}`
        );
    }

    crear(datos: EncomiendaRequest): Observable<Encomienda> {
        return this.http.post<Encomienda>(this.apiUrl, datos);
    }

    actualizar(
        id: number,
        datos: EncomiendaRequest
    ): Observable<Encomienda> {
        return this.http.put<Encomienda>(`${this.apiUrl}/${id}`, datos);
    }

    asignarVuelo(id: number, vueloId: number): Observable<Encomienda> {
        return this.http.patch<Encomienda>(
            `${this.apiUrl}/${id}/asignar-vuelo`,
            { vueloId }
        );
    }

    cambiarEstado(
        id: number,
        estado: EstadoEncomienda,
        recibidoPorNombre?: string,
        recibidoPorDni?: string
    ): Observable<Encomienda> {
        return this.http.patch<Encomienda>(
            `${this.apiUrl}/${id}/estado`,
            { estado, recibidoPorNombre, recibidoPorDni }
        );
    }

    cambiarEstadoAutorizacion(
        id: number,
        estado: EstadoAutorizacion
    ): Observable<Encomienda> {
        return this.http.patch<Encomienda>(
            `${this.apiUrl}/${id}/autorizacion`,
            { estado }
        );
    }

    marcarAbandonada(id: number): Observable<Encomienda> {
        return this.http.patch<Encomienda>(
            `${this.apiUrl}/${id}/abandonar`,
            {}
        );
    }

    desembarcar(id: number): Observable<Encomienda> {
        return this.http.patch<Encomienda>(
            `${this.apiUrl}/${id}/desembarcar`,
            {}
        );
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}