import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
    CambioReciente,
    RevisionGenerica
} from '../models/auditoria.model';

type TipoEntidadAuditada = 'Vuelo' | 'Encomienda' | 'Usuario';

@Injectable({
    providedIn: 'root'
})
export class AuditoriaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/auditoria';

    recientes(
        limite = 50,
        tipoEntidad?: TipoEntidadAuditada,
        operacion?: string,
        desde?: string,
        hasta?: string
    ): Observable<CambioReciente[]> {
        let params = new HttpParams().set('limite', limite);

        if (tipoEntidad) {
            params = params.set('tipoEntidad', tipoEntidad);
        }

        if (operacion) {
            params = params.set('operacion', operacion);
        }

        if (desde) {
            params = params.set('desde', desde);
        }

        if (hasta) {
            params = params.set('hasta', hasta);
        }

        return this.http.get<CambioReciente[]>(`${this.apiUrl}/recientes`, {
            params
        });
    }

    historial(
        tipoEntidad: TipoEntidadAuditada,
        id: number
    ): Observable<RevisionGenerica[]> {
        return this.http.get<RevisionGenerica[]>(
            `${this.apiUrl}/${this.ruta(tipoEntidad)}/${id}`
        );
    }

    restaurar(
        tipoEntidad: TipoEntidadAuditada,
        id: number,
        revision: number
    ): Observable<void> {
        return this.http.post<void>(
            `${this.apiUrl}/${this.ruta(tipoEntidad)}/${id}/restaurar/${revision}`,
            {}
        );
    }

    private ruta(tipoEntidad: TipoEntidadAuditada): string {
        switch (tipoEntidad) {
            case 'Vuelo':
                return 'vuelos';
            case 'Encomienda':
                return 'encomiendas';
            case 'Usuario':
                return 'usuarios';
        }
    }
}
