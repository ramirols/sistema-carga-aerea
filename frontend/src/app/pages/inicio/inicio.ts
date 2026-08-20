import {
    Component,
    inject,
    signal,
} from '@angular/core';

import {
    DatePipe,
    DecimalPipe,
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import {
    Router,
} from '@angular/router';

import { DialogModule } from 'primeng/dialog';

import { SeguimientoPublico } from '@core/models/seguimiento.model';
import { SeguimientoService } from '@core/services/seguimiento.service';

const CODIGO_VALIDO = /^[A-Za-z0-9-]{3,20}$/;

@Component({
    selector: 'app-inicio',
    standalone: true,
    imports: [
        DatePipe,
        DecimalPipe,
        FormsModule,
        DialogModule,
    ],
    templateUrl: './inicio.html',
})
export class Inicio {
    private readonly seguimientoService = inject(SeguimientoService);
    private readonly router = inject(Router);

    codigoRastreo = '';

    readonly popupRastreoVisible = signal(false);
    readonly buscando = signal(false);
    readonly resultado = signal<SeguimientoPublico | null>(null);
    readonly mensajeError = signal('');

    buscarEncomienda(): void {
        const codigo = this.codigoRastreo.trim().toUpperCase();

        this.resultado.set(null);
        this.mensajeError.set('');

        if (!codigo) {
            this.mensajeError.set(
                'Ingresa el código de tu encomienda para realizar la búsqueda.'
            );
            this.popupRastreoVisible.set(true);
            return;
        }

        if (!CODIGO_VALIDO.test(codigo)) {
            this.mensajeError.set(
                'El código ingresado no tiene un formato válido.'
            );
            this.popupRastreoVisible.set(true);
            return;
        }

        this.codigoRastreo = codigo;
        this.popupRastreoVisible.set(true);
        this.buscando.set(true);

        this.seguimientoService.rastrear(codigo).subscribe({
            next: (resultado) => {
                this.resultado.set(resultado);
                this.buscando.set(false);
            },
            error: (error) => {
                this.buscando.set(false);

                this.mensajeError.set(
                    error.error?.mensaje ??
                    `No encontramos ninguna encomienda con el código "${codigo}".`
                );
            },
        });
    }

    cerrarPopupRastreo(): void {
        this.popupRastreoVisible.set(false);
    }

    buscarOtroCodigo(): void {
        this.resultado.set(null);
        this.mensajeError.set('');
        this.codigoRastreo = '';
        this.popupRastreoVisible.set(false);

        setTimeout(() => {
            document
                .getElementById('codigoRastreo')
                ?.focus();
        });
    }

    abrirAsistente(): void {
        void this.router.navigate(['/rastreo']);
    }

    irAConsignatario(): void {
        const codigo = this.resultado()?.codigo;

        void this.router.navigate(['/consignatario'], {
            queryParams: codigo ? { codigo } : {},
        });
    }

    nombreEstado(estado: string): string {
        const estados: Record<string, string> = {
            EN_ALMACEN: 'En almacén',
            EMBARCADA: 'Embarcada',
            ARRIBADA: 'Arribada',
            ENTREGADA: 'Entregada',
            CANCELADA: 'Cancelada',
            ABANDONADA: 'Abandonada',
        };

        return estados[estado] ?? estado;
    }

    claseEstado(estado: string): string {
        const clases: Record<string, string> = {
            EN_ALMACEN:
                'bg-amber-500/10 text-amber-700 dark:text-amber-400',
            EMBARCADA:
                'bg-blue-500/10 text-blue-700 dark:text-blue-400',
            ARRIBADA:
                'bg-teal-500/10 text-teal-700 dark:text-teal-400',
            ENTREGADA:
                'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            CANCELADA:
                'bg-red-500/10 text-red-700 dark:text-red-400',
            ABANDONADA:
                'bg-slate-500/10 text-slate-700 dark:text-slate-300',
        };

        return (
            clases[estado] ??
            'bg-slate-500/10 text-slate-700 dark:text-slate-300'
        );
    }
}