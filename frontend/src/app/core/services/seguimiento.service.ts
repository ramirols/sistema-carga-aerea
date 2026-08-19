import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
    AutorizarRecojoRequest,
    SeguimientoPublico
} from '../models/seguimiento.model';

@Injectable({
    providedIn: 'root'
})
export class SeguimientoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/publico';

    rastrear(codigo: string): Observable<SeguimientoPublico> {
        return this.http.get<SeguimientoPublico>(
            `${this.apiUrl}/encomiendas/${encodeURIComponent(codigo)}`
        );
    }

    autorizarRecojo(
        codigo: string,
        datos: AutorizarRecojoRequest
    ): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/encomiendas/${encodeURIComponent(codigo)}/autorizado`,
            datos
        );
    }

    subirCartaPoder(codigo: string, archivo: File): Observable<void> {
        const formData = new FormData();
        formData.append('archivo', archivo);

        return this.http.post<void>(
            `${this.apiUrl}/encomiendas/${encodeURIComponent(codigo)}/carta-poder`,
            formData
        );
    }
}
